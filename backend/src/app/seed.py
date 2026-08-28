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
- Behavioral data (training sessions, events, windows, continuous auth)

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
    from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession
    from app.domain.aegis.models import BehavioralEvent, BehaviorWindow, DeviceProfile
    from app.domain.auth.models import Session, Device

    print("Connecting to MongoDB...")
    await init_db()

    # Check if already seeded
    existing_users = await User.find(User.roles != "admin").to_list()
    if not existing_users:
        print("No existing users found. Creating users with full data...")
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

            # Behavioral & Training Data (for admin visibility) - DISABLED to prevent synthetic data contamination
            # await _seed_behavioral_data(uid, account_ids)

        print("\nSeeding complete!")
        print(f"Demo users (password: Demo@1234567890):")
        for u in demo_users_data:
            print(f"  {u['email']}")
        await close_db()
        return
    else:
        print(f"Found {len(existing_users)} existing non-admin users. Adding behavioral/training data...")
        for user in existing_users:
            uid = user.id
            r = _seed_rand(uid)
            # Get account IDs for this user
            from app.domain.banking.models import BankAccount
            accounts = await BankAccount.find(BankAccount.user_id == uid).to_list()
            account_ids = [{"id": str(a.id), "type": a.type} for a in accounts]
            print(f"  Adding behavioral/training data for {user.email} ({uid})...")
            # await _seed_behavioral_data(uid, account_ids)  # DISABLED to prevent synthetic data contamination

        print("\nBehavioral/training data seeding complete!")
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

        # Behavioral & Training Data (for admin visibility)
        await _seed_behavioral_data(uid, account_ids)

    print("\nSeeding complete!")
    print(f"Demo users (password: Demo@1234567890):")
    for u in demo_users_data:
        print(f"  {u['email']}")
    await close_db()


async def _seed_behavioral_data(user_id: uuid.UUID, account_ids: list[dict]) -> None:
    """Seed behavioral and training data for admin panel visibility."""
    from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession
    from app.domain.aegis.models import BehavioralEvent, BehaviorWindow, DeviceProfile
    from app.domain.auth.models import Session as AuthSession, Device

    r = _seed_rand(user_id, seed_offset=500)
    now = datetime.now(UTC)
    primary_account = next(a for a in account_ids if a["type"] == "primary")

    # Create a session first
    session_id = uuid.uuid4()
    session_id = uuid.uuid4()
    auth_session = AuthSession(
        user_id=user_id,
        session_id=session_id,
        refresh_token_hash="seed_hash_" + str(session_id)[:8],
        device_id="seed_device_" + str(user_id)[:8],
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        expires_at=now + timedelta(days=30),
        revoked=False,
        last_active_at=now,
        created_at=now - timedelta(days=5),
    )
    await auth_session.insert()

    # Create device profile
    device_profile = DeviceProfile(
        user_id=user_id,
        fingerprint="fp_" + str(user_id)[:16],
        label="Chrome on Windows",
        kind="desktop",
        os="Windows 10",
        browser="Chrome 120.0",
        trust="trusted",
        last_active=now,
    )
    await device_profile.insert()

    # Training Sessions (3 completed, 1 in_progress)
    task_types = ["controlled_typing", "repeated_typing", "paragraph_typing", "mouse_tracking", "normal_navigation"]
    training_sessions = []
    for i, task_type in enumerate(task_types):
        ts = TrainingSession(
            user_id=user_id,
            session_id=uuid.uuid4(),
            device_id="seed_device_" + str(user_id)[:8],
            task_type=task_type,
            status="completed" if i < 3 else "in_progress",
            started_at=now - timedelta(days=5-i),
            completed_at=now - timedelta(days=5-i, hours=-1) if i < 3 else None,
            sample_count=r.randint(50, 200),
            metadata={"browser": "Chrome", "viewport": "1920x1080"},
        )
        training_sessions.append(ts)
    await TrainingSession.insert_many(training_sessions)
    print(f"  Created {len(training_sessions)} training sessions")

    # Training Events (for each session)
    training_events = []
    for ts in training_sessions:
        if ts.status == "completed":
            num_events = r.randint(30, 100)
            for j in range(num_events):
                event_type = r.choice(["keydown", "keyup", "mouse_move", "mouse_click", "mouse_scroll"])
                if event_type in ["keydown", "keyup"]:
                    event = TrainingEvent(
                        user_id=user_id,
                        session_id=ts.session_id,
                        task_type=ts.task_type,
                        event_type=event_type,
                        timestamp=now - timedelta(days=r.randint(0, 5), hours=r.randint(0, 23)),
                        device_id=ts.device_id,
                        page="training/" + ts.task_type,
                        key_code=r.randint(65, 90),
                        key_char=chr(r.randint(65, 90)),
                        dwell_time_ms=r.uniform(50, 200),
                        flight_time_ms=r.uniform(30, 150),
                        task_index=r.randint(0, 4),
                        trial_index=r.randint(0, 9),
                        text_length=r.randint(10, 100),
                        backspace_count=r.randint(0, 3),
                        correction_count=r.randint(0, 2),
                        total_duration_ms=r.uniform(1000, 30000),
                        pause_duration_ms=r.uniform(0, 5000),
                    )
                else:
                    event = TrainingEvent(
                        user_id=user_id,
                        session_id=ts.session_id,
                        task_type=ts.task_type,
                        event_type=event_type,
                        timestamp=now - timedelta(days=r.randint(0, 5), hours=r.randint(0, 23)),
                        device_id=ts.device_id,
                        page="training/" + ts.task_type,
                        x=r.uniform(100, 1800),
                        y=r.uniform(100, 900),
                        target_id=f"target_{r.randint(1, 20)}" if event_type in ["mouse_click"] else None,
                        target_size=r.choice(["small", "medium", "large"]) if event_type in ["mouse_click"] else None,
                        click_duration_ms=r.uniform(50, 300) if event_type == "mouse_click" else None,
                        delta_y=r.uniform(-50, 50) if event_type == "mouse_scroll" else None,
                        task_index=r.randint(0, 4),
                        trial_index=r.randint(0, 9),
                        total_duration_ms=r.uniform(1000, 30000),
                    )
                training_events.append(event)
    if training_events:
        await TrainingEvent.insert_many(training_events)
    print(f"  Created {len(training_events)} training events")

    # Training Features (one per completed session)
    training_features = []
    for ts in training_sessions:
        if ts.status == "completed":
            tf = TrainingFeature(
                user_id=user_id,
                session_id=ts.session_id,
                task_type=ts.task_type,
                task_index=0,
                trial_index=0,
                device_id=ts.device_id,
                typing_speed=r.uniform(2.5, 6.0),
                mean_key_hold=r.uniform(80, 150),
                std_key_hold=r.uniform(10, 40),
                mean_flight_time=r.uniform(50, 120),
                std_flight_time=r.uniform(5, 30),
                backspace_rate=r.uniform(0.01, 0.08),
                correction_rate=r.uniform(0.01, 0.05),
                pause_mean=r.uniform(100, 500),
                pause_std=r.uniform(50, 200),
                total_duration_ms=r.uniform(5000, 30000),
                mouse_speed_mean=r.uniform(500, 2000),
                mouse_speed_std=r.uniform(100, 500),
                mouse_acceleration=r.uniform(0.5, 3.0),
                click_interval_mean=r.uniform(200, 800),
                scroll_speed=r.uniform(100, 500),
                trajectory_length=r.uniform(1000, 50000),
                direction_changes=r.randint(5, 30),
                target_acquisition_mean=r.uniform(300, 800),
                feature_vector={
                    "typing_speed": r.uniform(2.5, 6.0),
                    "mean_key_hold": r.uniform(80, 150),
                    "mouse_speed_mean": r.uniform(500, 2000),
                },
            )
            training_features.append(tf)
    if training_features:
        await TrainingFeature.insert_many(training_features)
    print(f"  Created {len(training_features)} training features")

    # Behavioral Events (continuous auth - 5 sessions worth)
    behavioral_events = []
    session_ids = [uuid.uuid4() for _ in range(5)]
    for sid in session_ids:
        num_events = r.randint(20, 60)
        for j in range(num_events):
            event_type = r.choice(["keystroke", "mouse_move", "mouse_click", "mouse_scroll", "window_aggregate"])
            if event_type == "keystroke":
                event = BehavioralEvent(
                    user_id=user_id,
                    session_id=sid,
                    device_id=uuid.UUID("12345678-1234-1234-1234-123456789012") if r.random() > 0.5 else None,
                    event_type=event_type,
                    timestamp=now - timedelta(hours=r.randint(0, 72)),
                    key_code=r.randint(65, 90),
                    dwell_time_ms=r.uniform(50, 200),
                    flight_time_ms=r.uniform(30, 150),
                    feature_vector={
                        "dwellMeanMs": r.uniform(80, 150),
                        "flightMeanMs": r.uniform(50, 120),
                    } if r.random() > 0.7 else None,
                    device_info={"platform": "Win32", "viewport": "1920x1080"},
                )
            elif event_type in ["mouse_move", "mouse_click"]:
                event = BehavioralEvent(
                    user_id=user_id,
                    session_id=sid,
                    device_id=uuid.UUID("12345678-1234-1234-1234-123456789012") if r.random() > 0.5 else None,
                    event_type=event_type,
                    timestamp=now - timedelta(hours=r.randint(0, 72)),
                    x=r.uniform(100, 1800),
                    y=r.uniform(100, 900),
                    delta_x=r.uniform(-50, 50),
                    delta_y=r.uniform(-50, 50),
                    velocity=r.uniform(100, 2000),
                    feature_vector={
                        "velocityMean": r.uniform(500, 1500),
                        "curvatureMean": r.uniform(0.1, 0.5),
                    } if r.random() > 0.7 else None,
                    device_info={"platform": "Win32", "viewport": "1920x1080"},
                )
            elif event_type == "mouse_scroll":
                event = BehavioralEvent(
                    user_id=user_id,
                    session_id=sid,
                    event_type=event_type,
                    timestamp=now - timedelta(hours=r.randint(0, 72)),
                    delta_y=r.uniform(-100, 100),
                    feature_vector={"scrollAmount": abs(r.uniform(-100, 100))} if r.random() > 0.7 else None,
                    device_info={"platform": "Win32", "viewport": "1920x1080"},
                )
            else:  # window_aggregate
                window_start = now - timedelta(hours=r.randint(0, 72))
                window_end = window_start + timedelta(seconds=30)
                feature_vector = {
                    "dwellMeanMs": r.uniform(80, 150),
                    "dwellStdMs": r.uniform(10, 40),
                    "flightMeanMs": r.uniform(50, 120),
                    "flightStdMs": r.uniform(5, 30),
                    "keysPerSec": r.uniform(3, 6),
                    "velocityMean": r.uniform(500, 1500),
                    "velocityStd": r.uniform(100, 500),
                    "accelerationMean": r.uniform(0.5, 3.0),
                    "accelerationStd": r.uniform(0.1, 1.0),
                    "curvatureMean": r.uniform(0.1, 0.5),
                    "curvatureStd": r.uniform(0.05, 0.2),
                    "clickCount": r.randint(0, 10),
                    "scrollAmount": r.uniform(0, 500),
                    "mouseTravelPx": r.uniform(1000, 50000),
                }
                event = BehavioralEvent(
                    user_id=user_id,
                    session_id=sid,
                    event_type=event_type,
                    timestamp=now - timedelta(hours=r.randint(0, 72)),
                    window_start=window_start,
                    window_end=window_end,
                    feature_vector=feature_vector,
                    device_info={"platform": "Win32", "viewport": "1920x1080"},
                )
            behavioral_events.append(event)
    if behavioral_events:
        await BehavioralEvent.insert_many(behavioral_events)
    print(f"  Created {len(behavioral_events)} behavioral events")

    # Behavior Windows (aggregate features per session window)
    behavior_windows = []
    for sid in session_ids:
        num_windows = r.randint(8, 15)
        for j in range(num_windows):
            window_start = now - timedelta(hours=r.randint(0, 72))
            window_end = window_start + timedelta(seconds=30)
            bw = BehaviorWindow(
                user_id=user_id,
                session_id=sid,
                device_id=uuid.UUID("12345678-1234-1234-1234-123456789012") if r.random() > 0.5 else None,
                window_start=window_start,
                window_end=window_end,
                features={
                    "dwellMeanMs": r.uniform(80, 150),
                    "dwellStdMs": r.uniform(10, 40),
                    "flightMeanMs": r.uniform(50, 120),
                    "flightStdMs": r.uniform(5, 30),
                    "keysPerSec": r.uniform(3, 6),
                    "velocityMean": r.uniform(500, 1500),
                    "velocityStd": r.uniform(100, 500),
                    "accelerationMean": r.uniform(0.5, 3.0),
                    "accelerationStd": r.uniform(0.1, 1.0),
                    "curvatureMean": r.uniform(0.1, 0.5),
                    "curvatureStd": r.uniform(0.05, 0.2),
                    "clickCount": r.randint(0, 10),
                    "scrollAmount": r.uniform(0, 500),
                    "mouseTravelPx": r.uniform(1000, 50000),
                },
            )
            behavior_windows.append(bw)
    if behavior_windows:
        await BehaviorWindow.insert_many(behavior_windows)
    print(f"  Created {len(behavior_windows)} behavior windows")

    # Additional auth sessions (login history)
    for i in range(3):
        sid = uuid.uuid4()
        auth = AuthSession(
            user_id=user_id,
            session_id=sid,
            refresh_token_hash="seed_hash_" + str(sid)[:8],
            device_id="seed_device_" + str(user_id)[:8] + f"_{i}",
            ip_address=f"192.168.1.{100+i}",
            user_agent=r.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            ]),
            expires_at=now + timedelta(days=30),
            revoked=r.random() > 0.7,
            logged_out_at=now - timedelta(days=r.randint(1, 10)) if r.random() > 0.3 else None,
            last_active_at=now - timedelta(hours=r.randint(0, 48)),
            created_at=now - timedelta(days=r.randint(0, 14)),
        )
        await auth.insert()

    # Devices (check for existing fingerprints first)
    from app.domain.auth.models import Device as DeviceModel
    existing_devices = await DeviceModel.find(DeviceModel.user_id == user_id).to_list()
    existing_fps = {d.fingerprint for d in existing_devices}

    device_labels = [
        ("MacBook Pro - Chrome", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"),
        ("iPhone 15 - Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"),
        ("Windows PC - Edge", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
    ]

    added_devices = 0
    for i, (label, ua) in enumerate(device_labels):
        fp = f"fp_{user_id}_{i}"
        if fp in existing_fps:
            continue
        dev = Device(
            user_id=user_id,
            fingerprint=fp,
            label=label,
            user_agent=ua,
            ip_address=f"192.168.1.{110+i}",
            is_trusted=r.random() > 0.3,
            first_seen_at=now - timedelta(days=r.randint(10, 60)),
            last_seen_at=now - timedelta(hours=r.randint(0, 24)),
        )
        await dev.insert()
        added_devices += 1
    print(f"  Created {added_devices} devices + auth sessions + 1 device profile")


if __name__ == "__main__":
    asyncio.run(seed())
