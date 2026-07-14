"""
Seed script for AdaptiveGuard — creates 4 project users with realistic data.

Users: Amal, Manasa, Dristi, Vyas
- 4 accounts per user (checking, savings, investment, business)
- 200+ transactions per user across 6 months
- 5 beneficiaries per user
- 8 budget envelopes per user
- 3 cards per user
- 3 savings goals per user
- 60+ activity events per user

Usage: python -m app.seed
"""

from __future__ import annotations

import asyncio
import random
import uuid
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.db.mongodb import close_db, init_db


def _seed_rand(user_id: uuid.UUID, seed_offset: int = 0) -> random.Random:
    r = random.Random(str(user_id) + str(seed_offset))
    return r


CATEGORIES = [
    "groceries", "dining", "transport", "utilities", "shopping",
    "subscriptions", "travel", "health", "entertainment", "housing",
]
INCOME_CATEGORIES = ["payroll", "freelance", "investment", "interest"]
MERCHANTS_BY_CAT: dict[str, list[str]] = {
    "groceries": ["Whole Foods", "Trader Joe's", "Kroger", "Safeway", "Aldi", "Walmart Grocery"],
    "dining": ["Chipotle", "Sweetgreen", "DoorDash", "Starbucks", "Blue Bottle", "Shake Shack"],
    "transport": ["Uber", "Lyft", "Shell Gas", "Metro Transit", "Parking Garage"],
    "utilities": ["Comcast Internet", "PG&E Electric", "Water Co", "AT&T Mobile"],
    "shopping": ["Amazon", "Target", "Best Buy", "Nike", "Apple Store", "IKEA"],
    "subscriptions": ["Netflix", "Spotify", "AWS", "iCloud", "Disney+", "Notion"],
    "travel": ["United Airlines", "Marriott", "Airbnb", "Hertz", "Delta"],
    "health": ["CVS Pharmacy", "Kaiser", "One Medical", "Anthem Blue Cross"],
    "entertainment": ["AMC Theaters", "Ticketmaster", "Topgolf", "Steam"],
    "housing": ["Rent Payment", "HOA Dues", "Home Depot", "Lowe's"],
}

BENEFICIARIES = [
    {"name": "Maria Garcia", "bank": "Chase", "iban": "DE89 3704 0044 0532 0130 00"},
    {"name": "James Chen", "bank": "Bank of America", "iban": "FR14 2004 1010 0505 0001 3M02 606"},
    {"name": "Sarah Johnson", "bank": "Wells Fargo", "iban": "GB29 NWBK 6016 1331 9268 19"},
    {"name": "David Kim", "bank": "Citibank", "iban": "ES91 2100 0418 4502 0005 1332"},
    {"name": "Emma Wilson", "bank": "HSBC", "iban": "CH93 0076 2011 6238 5295 7"},
]

BUDGET_DATA = [
    {"category": "Housing", "budgeted": 2_500, "color": "#6366F1"},
    {"category": "Groceries", "budgeted": 800, "color": "#10B981"},
    {"category": "Dining", "budgeted": 600, "color": "#F59E0B"},
    {"category": "Transport", "budgeted": 400, "color": "#3B82F6"},
    {"category": "Utilities", "budgeted": 350, "color": "#8B5CF6"},
    {"category": "Shopping", "budgeted": 500, "color": "#EC4899"},
    {"category": "Entertainment", "budgeted": 300, "color": "#EF4444"},
    {"category": "Health", "budgeted": 250, "color": "#14B8A6"},
]

CARD_DATA = [
    {"label": "Platinum Debit", "kind": "primary", "network": "visa", "last4": "4827", "holder": "User", "exp": "12/28", "finish": "platinum"},
    {"label": "Travel Rewards", "kind": "credit", "network": "mastercard", "last4": "3156", "holder": "User", "exp": "09/27", "finish": "champagne"},
    {"label": "Virtual Card", "kind": "virtual", "network": "visa", "last4": "9041", "holder": "User", "exp": "03/29", "finish": "iris"},
]

SAVINGS_GOALS = [
    {"name": "Vacation Fund", "target": 10_000, "image": "beach"},
    {"name": "New Car", "target": 35_000, "image": "car"},
    {"name": "Emergency Fund", "target": 20_000, "image": "shield"},
]


def _generate_transactions(
    user_id: uuid.UUID,
    accounts: list[dict],
    num_months: int = 6,
) -> list[dict]:
    r = _seed_rand(user_id, seed_offset=42)
    now = datetime.now(UTC)
    txns: list[dict] = []
    base_ref = 10000

    for month_offset in range(num_months):
        if month_offset == 0:
            month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
            max_day = min(now.day - 1, 28)
        else:
            month_start = datetime(now.year, now.month, 1, tzinfo=UTC) - timedelta(days=30 * month_offset)
            month_start = month_start.replace(day=1)
            max_day = 28

        # Salary deposit on the 1st
        salary_account = next(a for a in accounts if a["type"] == "primary")
        salary = r.uniform(7_500, 9_500)
        txns.append({
            "account_id": salary_account["id"],
            "date": month_start,
            "description": "Monthly Salary — TechCorp Inc",
            "amount": round(salary, 2),
            "currency": "USD",
            "type": "credit",
            "status": "completed",
            "category": "payroll",
            "beneficiary": "TechCorp Inc",
            "reference": f"PAY-{month_start.strftime('%Y%m')}-001",
        })

        # 25-35 debit transactions per month
        num_debits = r.randint(25, 35)
        for _ in range(num_debits):
            category = r.choice(CATEGORIES)
            merchant = r.choice(MERCHANTS_BY_CAT[category])
            amount = round(r.uniform(5, 500), 2) if category != "housing" else round(r.uniform(1_000, 2_500), 2)
            day = r.randint(1, max_day)
            txn_date = month_start + timedelta(days=day, hours=r.randint(8, 20), minutes=r.randint(0, 59))
            account = next(a for a in accounts if a["type"] in ("primary", "business"))

            base_ref += 1
            txns.append({
                "account_id": account["id"],
                "date": txn_date,
                "description": merchant,
                "amount": round(amount, 2),
                "currency": "USD",
                "type": "debit",
                "status": "completed",
                "category": category,
                "beneficiary": merchant,
                "reference": f"TXN-{base_ref:06d}",
            })

    txns.sort(key=lambda t: t["date"])
    return txns


def _generate_activity_for_txns(user_id: uuid.UUID, txns: list[dict]) -> list[dict]:
    r = _seed_rand(user_id, seed_offset=99)
    events: list[dict] = []
    for t in txns[:50]:  # Only create activity for latest 50 transactions
        if t["type"] == "credit":
            desc = f"Received {t['amount']:,.2f} {t['currency']} — {t['description']}"
            etype = "deposit"
        else:
            desc = f"Paid {t['amount']:,.2f} {t['currency']} to {t['beneficiary']}"
            etype = "transaction"

        events.append({
            "type": etype,
            "description": desc,
            "occurred_at": t["date"] + timedelta(minutes=1),
        })

    # Add some login events
    for day_offset in range(10):
        dt = datetime.now(UTC) - timedelta(days=day_offset, hours=r.randint(0, 12))
        events.append({
            "type": "login",
            "description": "Logged in from Chrome on Windows",
            "occurred_at": dt,
        })

    events.sort(key=lambda e: e["occurred_at"], reverse=True)
    return events


async def seed() -> None:
    from app.domain.auth.models import User
    from app.domain.auth.security import hash_password
    from app.domain.banking.models import (
        ActivityEvent,
        BankAccount,
        BankCard,
        Beneficiary,
        BudgetEnvelope,
        SavingsGoal,
        TransactionRecord,
    )

    print("Connecting to MongoDB...")
    await init_db()

    # Check if already seeded
    existing_users = await User.find(User.roles != "admin").count()
    if existing_users > 0:
        print(f"Found {existing_users} existing non-admin users. Skipping seed.")
        await close_db()
        return

    pwd = hash_password("Demo@1234567890")

    demo_users_data = [
        {"email": "amal@adaptiveguardian.dev", "full_name": "Amal Varghese"},
        {"email": "manasa@adaptiveguardian.dev", "full_name": "Manasa"},
        {"email": "dristi@adaptiveguardian.dev", "full_name": "Dristi"},
        {"email": "vyas@adaptiveguardian.dev", "full_name": "Vyas"},
    ]

    for user_data in demo_users_data:
        user = User(
            email=user_data["email"],
            password_hash=pwd,
            full_name=user_data["full_name"],
            is_verified=True,
            roles=["user"],
        )
        user = await user.insert()
        uid = user.id
        r = _seed_rand(uid)
        print(f"Seeding {user_data['email']} ({uid})...")

        # Accounts
        account_ids: list[dict] = []
        from app.domain.banking.mock_data import generate_accounts
        mock_accounts = generate_accounts(uid)
        for i, acct in enumerate(mock_accounts):
            doc = BankAccount(
                user_id=uid,
                name=acct["name"],
                type=acct["type"],
                currency=acct["currency"],
                balance=round(acct["balance"], 2),
                pending=acct.get("pending", 0),
                iban=acct["iban"],
                delta_pct=acct["delta_pct"],
                spark=[round(s, 1) for s in acct["spark"]],
                status="active",
            )
            await doc.insert()
            account_ids.append({"id": str(doc.id), "type": acct["type"]})
        print(f"  Created {len(account_ids)} accounts")

        # Transactions
        txns = _generate_transactions(uid, account_ids)
        txn_docs = [
            TransactionRecord(
                user_id=uid,
                account_id=t["account_id"],
                date=t["date"],
                description=t["description"],
                amount=t["amount"],
                currency=t["currency"],
                type=t["type"],
                status=t["status"],
                category=t.get("category"),
                beneficiary=t.get("beneficiary"),
                reference=t.get("reference"),
            )
            for t in txns
        ]
        if txn_docs:
            await TransactionRecord.insert_many(txn_docs)
        print(f"  Created {len(txn_docs)} transactions")

        # Beneficiaries
        for b in BENEFICIARIES:
            beneficiary = Beneficiary(
                user_id=uid,
                name=b["name"],
                iban=b["iban"],
                bank=b["bank"],
                currency="USD",
            )
            await beneficiary.insert()
        print(f"  Created {len(BENEFICIARIES)} beneficiaries")

        # Budgets
        for b in BUDGET_DATA:
            budget = BudgetEnvelope(
                user_id=uid,
                category=b["category"],
                budgeted=b["budgeted"],
                spent=round(b["budgeted"] * r.uniform(0.3, 0.9), 2),
                currency="USD",
                color=b["color"],
            )
            await budget.insert()
        print(f"  Created {len(BUDGET_DATA)} budgets")

        # Cards
        for c in CARD_DATA:
            card = BankCard(
                user_id=uid,
                label=c["label"],
                kind=c["kind"],
                network=c["network"],
                last4=c["last4"],
                holder=user_data["full_name"],
                exp=c["exp"],
                frozen=False,
                finish=c["finish"],
                limits={
                    "daily": 5_000,
                    "monthly": 50_000,
                    "atm": 1_000,
                    "usedDaily": r.uniform(0, 500),
                    "usedMonthly": r.uniform(0, 2_000),
                    "usedAtm": r.uniform(0, 200),
                },
                spent_month=round(r.uniform(500, 2_000), 2),
            )
            await card.insert()
        print(f"  Created {len(CARD_DATA)} cards")

        # Savings Goals
        for sg in SAVINGS_GOALS:
            goal = SavingsGoal(
                user_id=uid,
                name=sg["name"],
                target=sg["target"],
                current=round(sg["target"] * r.uniform(0.1, 0.6), 2),
                currency="USD",
                deadline=(datetime.now(UTC) + timedelta(days=r.randint(180, 730))).strftime("%Y-%m-%d"),
                image=sg["image"],
            )
            await goal.insert()
        print(f"  Created {len(SAVINGS_GOALS)} savings goals")

        # Activity Events
        activities = _generate_activity_for_txns(uid, txns)
        activity_docs = [
            ActivityEvent(
                user_id=uid,
                type=a["type"],
                description=a["description"],
                occurred_at=a["occurred_at"],
            )
            for a in activities
        ]
        if activity_docs:
            await ActivityEvent.insert_many(activity_docs)
        print(f"  Created {len(activity_docs)} activity events")

    print("\nSeeding complete!")
    print(f"Demo users (password: Demo@1234567890):")
    for u in demo_users_data:
        print(f"  {u['email']}")
    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
