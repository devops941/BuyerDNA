from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TransactionResponse(BaseModel):
    id: str
    datasetId: str
    customerId: str
    transactionId: str
    transactionDate: datetime
    productId: str = "PROD-1"
    productCategory: str = "General"
    quantity: int = 1
    unitPrice: float = 0
    totalAmount: float
    paymentMethod: str = "Credit Card"
    discount: float = 0
    channel: str = "Online"
    createdAt: Optional[datetime] = None
