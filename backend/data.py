from datetime import date, timedelta
import copy

TODAY = date.today()

USER = {
    "id": "u_001",
    "name": "Aina Tan",
    "city": "Kuala Lumpur",
    "monthly_income": 6200,
    "salary_day": 25,
}

# ── INITIAL SEED DATA (CONSTANTS) ────────────────────────────
INITIAL_GOALS = [
    {
        "id": "goal_travel",
        "name": "Japan Travel",
        "target_amount": 5000,
        "current_amount": 850,
        "monthly_contribution": 220,
        "target_date": str(TODAY + timedelta(days=300)),
    },
    {
        "id": "goal_emergency",
        "name": "Emergency Fund",
        "target_amount": 8000,
        "current_amount": 1150,
        "monthly_contribution": 350,
        "target_date": str(TODAY + timedelta(days=520)),
    },
]

INITIAL_TRANSACTIONS = [
    {"id": "tx_seed1", "date": str(TODAY), "merchant": "GrabFood Nasi Lemak Co", "amount": -22.9, "type": "expense",
     "main_category": "Food & Beverage", "sub_category": "Food Delivery", "behavioral_tag": "delivery_dependency", "source": "GrabPay"},
    {"id": "tx_seed2", "date": str(TODAY - timedelta(days=1)), "merchant": "ZUS Coffee", "amount": -14.5, "type": "expense",
     "main_category": "Food & Beverage", "sub_category": "Café / Coffee", "behavioral_tag": "daily_habit", "source": "GXBank"},
    {"id": "tx_seed3", "date": str(TODAY - timedelta(days=5)), "merchant": "Jaya Grocer", "amount": -236.2, "type": "expense",
     "main_category": "Food & Beverage", "sub_category": "Grocery", "behavioral_tag": "essential", "source": "GXBank"},
    {"id": "tx_seed4", "date": str(TODAY - timedelta(days=3)), "merchant": "Tenaga Nasional", "amount": -168.4, "type": "expense",
     "main_category": "Living Expenses", "sub_category": "Utilities", "behavioral_tag": "essential", "source": "GXBank"},
    {"id": "tx_seed5", "date": str(TODAY - timedelta(days=2)), "merchant": "Salary - Fintech Sdn Bhd", "amount": 3200.0, "type": "income",
     "main_category": "Income", "sub_category": "Employment Income", "behavioral_tag": None, "source": "GXBank"},
    {"id": "tx_seed6", "date": str(TODAY - timedelta(days=10)), "merchant": "Shopee Flash Sale", "amount": -158.0, "type": "expense",
     "main_category": "Shopping", "sub_category": "Online Shopping", "behavioral_tag": "impulse", "source": "GrabPay"},
    {"id": "tx_seed7", "date": str(TODAY - timedelta(days=12)), "merchant": "Grab Ride", "amount": -18.5, "type": "expense",
     "main_category": "Transport", "sub_category": "Ride-hailing", "behavioral_tag": "convenience_spending", "source": "GrabPay"},
    {"id": "tx_seed8", "date": str(TODAY - timedelta(days=13)), "merchant": "Starbucks KLCC", "amount": -22.0, "type": "expense",
     "main_category": "Food & Beverage", "sub_category": "Café / Coffee", "behavioral_tag": "daily_habit", "source": "GXBank"},
    {"id": "tx_seed_sg1", "date": str(TODAY - timedelta(days=1)), "merchant": "Shake Shack Jewel Changi", "amount": -28.5, "type": "expense",
     "main_category": "Food & Beverage", "sub_category": "Dining", "currency": "SGD", "behavioral_tag": "travel", "source": "GXBank"},
    {"id": "tx_seed_sg2", "date": str(TODAY - timedelta(days=2)), "merchant": "Uniqlo Orchard", "amount": -45.0, "type": "expense",
     "main_category": "Shopping", "sub_category": "Clothing", "currency": "SGD", "behavioral_tag": "travel", "source": "GXBank"},
    {"id": "tx_seed9", "date": str(TODAY - timedelta(days=15)), "merchant": "Initial Balance", "amount": 1200.0, "type": "income",
     "main_category": "Income", "sub_category": "Opening Balance", "behavioral_tag": None, "source": "GXBank"},
]

INITIAL_LOAN_ACCOUNT = {
    "source": "LoanBook",
    "loans": [
        {
            "id": "loan_ptptn",
            "name": "PTPTN",
            "principal": 1800,
            "outstanding": 850,
            "monthly_payment": 120,
            "interest_rate": 1.0,
            "remaining_months": 31,
        }
    ],
}

INITIAL_INVESTMENTS = [
    {
        "id": "inv_1",
        "name": "ASB (Amanah Saham)",
        "amount_invested": 900.0,
        "current_value": 980.0,
    },
    {
        "id": "inv_2",
        "name": "StashAway ETF",
        "amount_invested": 350.0,
        "current_value": 320.0,
    },
]

# ── MUTABLE STATE ────────────────────────────────────────────
GOALS = copy.deepcopy(INITIAL_GOALS)
TRANSACTIONS = copy.deepcopy(INITIAL_TRANSACTIONS)
LOAN_ACCOUNT = copy.deepcopy(INITIAL_LOAN_ACCOUNT)
INVESTMENTS = copy.deepcopy(INITIAL_INVESTMENTS)

BANK_ACCOUNT = {
    "source": "GXBank",
    "account_id": "gx_7788",
    "currency": "MYR",
}

WALLET_ACCOUNT = {
    "source": "GrabPay",
    "wallet_id": "grab_2219",
    "currency": "MYR",
}

PEER_AVERAGES = {
    "Food & Beverage": 0.20,
    "Transport": 0.08,
    "Living Expenses": 0.25,
    "Shopping": 0.07,
    "Financial Services": 0.10,
    "Health & Wellness": 0.04,
    "Entertainment": 0.05,
    "Education": 0.03,
    "Travel": 0.05,
    "Income": 0.0,
    "Other": 0.02,
}

def reset_all_data():
    """Restores all mutable lists and dicts to their deep-copied initial state."""
    global GOALS, TRANSACTIONS, LOAN_ACCOUNT, INVESTMENTS
    GOALS[:] = copy.deepcopy(INITIAL_GOALS)
    TRANSACTIONS[:] = copy.deepcopy(INITIAL_TRANSACTIONS)
    INVESTMENTS[:] = copy.deepcopy(INITIAL_INVESTMENTS)
    # For dictionaries, we clear and update
    LOAN_ACCOUNT.clear()
    LOAN_ACCOUNT.update(copy.deepcopy(INITIAL_LOAN_ACCOUNT))
    return True
