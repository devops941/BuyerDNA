import os
import io
import json
from datetime import datetime
from pathlib import Path
import pandas as pd
from bson import ObjectId
from app.config.db import get_db
from app.config.env import settings

AUTO_DETECT_MAP = {
    "customerId": ["customer_id", "customerid", "customer", "cust_id", "client_id", "user_id", "custid"],
    "transactionId": ["transaction_id", "transactionid", "invoice_no", "invoiceno", "invoice", "order_id", "orderid", "tx_id"],
    "transactionDate": ["transaction_date", "transactiondate", "date", "invoicedate", "order_date", "timestamp"],
    "productId": ["product_id", "productid", "item_id", "stockcode", "sku", "product"],
    "productCategory": ["product_category", "category", "dept", "department", "group"],
    "quantity": ["quantity", "qty", "count", "units"],
    "unitPrice": ["unit_price", "unitprice", "price", "rate"],
    "totalAmount": ["total_amount", "totalamount", "total", "amount", "sales", "revenue", "spending"],
    "customerName": ["customer_name", "name", "client_name", "full_name"],
    "paymentMethod": ["payment_method", "payment", "method", "tender"],
    "discount": ["discount", "discount_rate", "disc"],
    "channel": ["channel", "store_channel", "platform"],
    "city": ["city", "location"],
    "region": ["region", "state", "country"],
}


def parse_file_to_rows(file_path: str) -> list:
    ext = Path(file_path).suffix.lower()
    if ext in (".xlsx", ".xls"):
        df = pd.read_excel(file_path)
    elif ext == ".csv":
        df = pd.read_csv(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
    df = df.where(pd.notna(df), None)
    return df.to_dict(orient="records")


def detect_columns(first_row: dict) -> dict:
    file_columns = list(first_row.keys())
    detected: dict = {}
    for col in file_columns:
        clean = col.lower().replace(r"[^a-z0-9_]", "")
        import re
        clean = re.sub(r"[^a-z0-9_]", "", col.lower())
        for target_key, candidates in AUTO_DETECT_MAP.items():
            if any(clean == c or c in clean for c in candidates):
                if target_key not in detected:
                    detected[target_key] = col
    return {"fileColumns": file_columns, "detectedMapping": detected}


async def validate_and_ingest_dataset(dataset_id: str, user_mapping: dict = None) -> dict:
    db = get_db()
    dataset = await db.datasets.find_one({"_id": ObjectId(dataset_id)})
    if not dataset:
        raise ValueError("Dataset not found")

    await db.datasets.update_one({"_id": ObjectId(dataset_id)}, {"$set": {"status": "validating"}})

    rows = parse_file_to_rows(dataset["filePath"])
    if not rows:
        await db.datasets.update_one({"_id": ObjectId(dataset_id)}, {"$set": {"status": "failed"}})
        raise ValueError("The uploaded file is empty.")

    detected = detect_columns(rows[0])["detectedMapping"]
    mapping = {**detected, **(user_mapping or {})}

    cust_col = mapping.get("customerId", "customer_id")
    tx_col = mapping.get("transactionId", "transaction_id")
    date_col = mapping.get("transactionDate", "transaction_date")
    amount_col = mapping.get("totalAmount", "total_amount")
    price_col = mapping.get("unitPrice", "unit_price")
    qty_col = mapping.get("quantity", "quantity")
    prod_col = mapping.get("productId", "product_id")
    cat_col = mapping.get("productCategory", "product_category")

    missing_values = duplicates = negative_amounts = invalid_dates = corrected_rows = rejected_rows = 0
    valid_txs = []
    rejected_records = []
    seen_tx = set()

    for idx, row in enumerate(rows):
        customer_id = str(row.get(cust_col, "") or "").strip()
        transaction_id = str(row.get(tx_col, "") or f"TX-{idx+1}").strip()
        raw_date = row.get(date_col)

        has_issue = False
        issues = []

        if not customer_id:
            missing_values += 1
            has_issue = True
            issues.append("Missing customer ID")

        if transaction_id in seen_tx:
            duplicates += 1
            has_issue = True
            issues.append("Duplicate transaction ID")
        else:
            seen_tx.add(transaction_id)

        try:
            parsed_date = pd.to_datetime(raw_date)
            if pd.isna(parsed_date):
                raise ValueError()
            parsed_date = parsed_date.to_pydatetime()
        except Exception:
            invalid_dates += 1
            has_issue = True
            issues.append("Invalid transaction date")
            parsed_date = None

        try:
            total = float(row.get(amount_col) or 0)
        except (TypeError, ValueError):
            total = None

        try:
            qty = float(row.get(qty_col) or 1) or 1
        except (TypeError, ValueError):
            qty = 1

        try:
            unit_price = float(row.get(price_col) or 0)
        except (TypeError, ValueError):
            unit_price = 0

        if total is None:
            if unit_price and qty and unit_price * qty > 0:
                total = unit_price * qty
                corrected_rows += 1
            else:
                missing_values += 1
                has_issue = True
                issues.append("Missing or non-numeric amount")
                total = 0

        if total < 0:
            negative_amounts += 1
            has_issue = True
            issues.append("Negative amount detected")

        if has_issue:
            rejected_rows += 1
            rejected_records.append({**{str(k): str(v) for k, v in row.items()}, "rejectionReasons": ", ".join(issues)})
        else:
            valid_txs.append({
                "datasetId": ObjectId(dataset_id),
                "customerId": customer_id,
                "transactionId": transaction_id,
                "transactionDate": parsed_date,
                "productId": str(row.get(prod_col) or "PROD-1").strip(),
                "productCategory": str(row.get(cat_col) or "General").strip(),
                "quantity": max(1, int(qty)),
                "unitPrice": unit_price if unit_price > 0 else total / max(1, qty),
                "totalAmount": total,
                "paymentMethod": str(row.get(mapping.get("paymentMethod", "payment_method")) or "Credit Card"),
                "discount": float(row.get(mapping.get("discount", "discount") or 0) or 0),
                "channel": str(row.get(mapping.get("channel", "channel")) or "Online"),
                "createdAt": datetime.utcnow(),
            })

    error_rate = (rejected_rows / len(rows)) * 100 if rows else 0
    quality_score = max(10, round(100 - error_rate * 1.5))

    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    rejected_file = os.path.join(upload_dir, f"rejected-{dataset_id}.json")
    with open(rejected_file, "w") as f:
        json.dump(rejected_records, f, indent=2, default=str)

    await db.transactions.delete_many({"datasetId": ObjectId(dataset_id)})
    if valid_txs:
        chunk_size = 500
        for i in range(0, len(valid_txs), chunk_size):
            await db.transactions.insert_many(valid_txs[i:i + chunk_size])

    update_data = {
        "rowCount": len(valid_txs),
        "columnCount": len(rows[0]) if rows else 0,
        "qualityScore": quality_score,
        "rejectedFilePath": rejected_file,
        "status": "ready",
        "validationSummary": {
            "missingValues": missing_values,
            "duplicates": duplicates,
            "negativeAmounts": negative_amounts,
            "invalidDates": invalid_dates,
            "correctedRows": corrected_rows,
            "rejectedRows": rejected_rows,
            "totalPassed": len(valid_txs),
        },
        "updatedAt": datetime.utcnow(),
    }
    await db.datasets.update_one({"_id": ObjectId(dataset_id)}, {"$set": update_data})
    updated = await db.datasets.find_one({"_id": ObjectId(dataset_id)})
    return _doc(updated)


def _doc(d: dict) -> dict:
    if d is None:
        return None
    d["id"] = str(d.pop("_id"))
    if "userId" in d and d["userId"]:
        d["userId"] = str(d["userId"])
    if "datasetId" in d and d["datasetId"]:
        d["datasetId"] = str(d["datasetId"])
    return d
