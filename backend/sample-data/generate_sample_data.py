import random
import csv
import os
from datetime import datetime, timedelta

def generate_dataset():
    random.seed(42)
    categories = {
        'Electronics': [
            ('PROD-EL01', 'Wireless Noise-Cancelling Headphones', 199.99),
            ('PROD-EL02', 'Ultra HD 4K Monitor 27"', 349.50),
            ('PROD-EL03', 'Ergonomic Mechanical Keyboard', 89.00),
            ('PROD-EL04', 'USB-C Fast Charging Hub', 39.99),
            ('PROD-EL05', 'Portable Bluetooth Speaker', 59.99),
        ],
        'Apparel & Fashion': [
            ('PROD-AP01', 'Classic Merino Wool Sweater', 75.00),
            ('PROD-AP02', 'Slim Fit Stretch Denim Jeans', 65.50),
            ('PROD-AP03', 'Waterproof Trail Running Jacket', 120.00),
            ('PROD-AP04', 'Breathable Athletic Performance Tee', 28.00),
            ('PROD-AP05', 'Handcrafted Leather Belt', 45.00),
        ],
        'Home & Living': [
            ('PROD-HM01', 'Ceramic Pour-Over Coffee Maker', 35.00),
            ('PROD-HM02', 'Linen Cotton Bedding Set Queen', 110.00),
            ('PROD-HM03', 'Aromatherapy Ultrasonic Diffuser', 42.00),
            ('PROD-HM04', 'Stainless Steel Kitchen Knife Set', 85.00),
            ('PROD-HM05', 'Bamboo Ergonomic Desk Organizer', 24.50),
        ],
        'Beauty & Personal Care': [
            ('PROD-BT01', 'Hyaluronic Acid Hydrating Serum', 32.00),
            ('PROD-BT02', 'Organic Vitamin C Glow Cleanser', 26.50),
            ('PROD-BT03', 'Deep Repair Botanical Hair Mask', 38.00),
            ('PROD-BT04', 'Mineral Sunscreen SPF 50', 29.00),
            ('PROD-BT05', 'Revitalizing Night Eye Cream', 48.00),
        ],
        'Sports & Outdoors': [
            ('PROD-SP01', 'High-Density Non-Slip Yoga Mat', 40.00),
            ('PROD-SP02', 'Insulated Stainless Steel Bottle 32oz', 28.00),
            ('PROD-SP03', 'Adjustable Dumbbell Set 50lbs', 180.00),
            ('PROD-SP04', 'Ultralight Compact Hiking Backpack', 95.00),
            ('PROD-SP05', 'Resistance Bands Multi-Pack', 22.00),
        ],
    }

    cities_regions = [
        ('New York', 'North America', 'US'),
        ('San Francisco', 'North America', 'US'),
        ('Chicago', 'North America', 'US'),
        ('London', 'Europe', 'UK'),
        ('Berlin', 'Europe', 'DE'),
        ('Paris', 'Europe', 'FR'),
        ('Toronto', 'North America', 'CA'),
        ('Sydney', 'Asia-Pacific', 'AU'),
        ('Singapore', 'Asia-Pacific', 'SG'),
        ('Tokyo', 'Asia-Pacific', 'JP'),
    ]

    first_names = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Lucas', 'Mia', 'Henry', 'Evelyn',
                   'Alexander', 'Harper', 'Sebastian', 'Luna', 'Jack', 'Ella', 'Daniel', 'Chloe', 'Matthew', 'Aria']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
                  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White']

    # Generate 150 customers
    customers = []
    for i in range(1, 151):
        c_id = f"CUST-{1000 + i}"
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        c_name = f"{fn} {ln}"
        city, region, country = random.choice(cities_regions)
        gender = random.choice(['Female', 'Male', 'Non-Binary'])
        age = random.randint(21, 68)
        # customer archetype: champion (freq high, recency recent), lapsing (recency old), new (1 purchase recent)
        archetype = random.choices(
            ['champion', 'loyal', 'promising', 'at_risk', 'hibernating', 'new'],
            weights=[0.15, 0.25, 0.20, 0.15, 0.15, 0.10],
            k=1
        )[0]
        customers.append({
            'customer_id': c_id,
            'name': c_name,
            'email': f"{fn.lower()}.{ln.lower()}{i}@example.com",
            'city': city,
            'region': region,
            'gender': gender,
            'age': age,
            'archetype': archetype
        })

    end_date = datetime(2026, 3, 15)
    start_date = end_date - timedelta(days=365)

    payment_methods = ['Credit Card', 'PayPal', 'Apple Pay', 'Debit Card', 'Bank Transfer']
    channels = ['Online Web', 'Mobile App', 'In-Store POS']

    transactions = []
    tx_counter = 10001

    for c in customers:
        arch = c['archetype']
        if arch == 'champion':
            order_count = random.randint(7, 15)
            recency_days = random.randint(1, 20)
        elif arch == 'loyal':
            order_count = random.randint(4, 7)
            recency_days = random.randint(10, 45)
        elif arch == 'promising':
            order_count = random.randint(2, 4)
            recency_days = random.randint(20, 60)
        elif arch == 'at_risk':
            order_count = random.randint(3, 8)
            recency_days = random.randint(75, 180)
        elif arch == 'hibernating':
            order_count = random.randint(1, 3)
            recency_days = random.randint(160, 320)
        else: # new
            order_count = 1
            recency_days = random.randint(2, 30)

        # Generate transaction dates
        last_date = end_date - timedelta(days=recency_days)
        dates = [last_date]
        for _ in range(order_count - 1):
            interval = random.randint(15, 60)
            prev_d = dates[-1] - timedelta(days=interval)
            if prev_d < start_date:
                prev_d = start_date + timedelta(days=random.randint(1, 30))
            dates.append(prev_d)
        dates.sort()

        for d in dates:
            category_name = random.choice(list(categories.keys()))
            prod_id, prod_name, price = random.choice(categories[category_name])
            qty = random.choices([1, 2, 3, 4], weights=[0.65, 0.22, 0.09, 0.04], k=1)[0]
            disc_rate = random.choices([0.0, 0.05, 0.10, 0.15, 0.20], weights=[0.5, 0.2, 0.15, 0.1, 0.05], k=1)[0]
            total = round(qty * price * (1.0 - disc_rate), 2)

            transactions.append({
                'transaction_id': f"TX-{tx_counter}",
                'customer_id': c['customer_id'],
                'customer_name': c['name'],
                'transaction_date': d.strftime('%Y-%m-%d'),
                'product_id': prod_id,
                'product_name': prod_name,
                'product_category': category_name,
                'quantity': qty,
                'unit_price': price,
                'total_amount': total,
                'discount': disc_rate,
                'payment_method': random.choice(payment_methods),
                'channel': random.choice(channels),
                'city': c['city'],
                'region': c['region'],
                'gender': c['gender'],
                'age': c['age'],
            })
            tx_counter += 1

    # Shuffle transactions so they look like real multi-customer logs
    random.shuffle(transactions)

    # Write CSV
    out_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(out_dir, "retail_transactions_sample.csv")

    fieldnames = [
        'transaction_id', 'customer_id', 'customer_name', 'transaction_date',
        'product_id', 'product_name', 'product_category', 'quantity', 'unit_price',
        'total_amount', 'discount', 'payment_method', 'channel', 'city', 'region', 'gender', 'age'
    ]

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in transactions:
            writer.writerow(row)

    print(f"Sample dataset generated successfully: {csv_path}")
    print(f"Total transactions: {len(transactions)} across {len(customers)} unique customers.")

if __name__ == '__main__':
    generate_dataset()
