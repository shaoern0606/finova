from datetime import date, timedelta


TODAY = date.today()

USER = {
    "id": "u_001",
    "name": "Aina Tan",
    "city": "Kuala Lumpur",
    "monthly_income": 6200,
    "salary_day": 25,
}

GOALS = [
    {
        "id": "goal_travel",
        "name": "Japan Travel",
        "target_amount": 5000,
        "current_amount": 1850,
        "monthly_contribution": 420,
        "target_date": str(TODAY + timedelta(days=300)),
    },
    {
        "id": "goal_emergency",
        "name": "Emergency Fund",
        "target_amount": 12000,
        "current_amount": 4700,
        "monthly_contribution": 700,
        "target_date": str(TODAY + timedelta(days=520)),
    },
]

BANK_ACCOUNT = {
    "source": "GXBank",
    "account_id": "gx_7788",
    "balance": 8420.75,
    "currency": "MYR",
    "transactions": [
        {"id": "b1", "date": str(TODAY - timedelta(days=1)), "merchant": "Salary - Fintech Sdn Bhd", "amount": 6200, "type": "income"},
        {"id": "b2", "date": str(TODAY - timedelta(days=2)), "merchant": "KL Sentral Residence", "amount": -1850, "type": "expense"},
        {"id": "b3", "date": str(TODAY - timedelta(days=3)), "merchant": "PTPTN Autopay", "amount": -330, "type": "expense"},
        {"id": "b4", "date": str(TODAY - timedelta(days=5)), "merchant": "Tenaga Nasional", "amount": -168.4, "type": "expense"},
        {"id": "b5", "date": str(TODAY - timedelta(days=8)), "merchant": "Jaya Grocer", "amount": -236.2, "type": "expense"},
        {"id": "b6", "date": str(TODAY - timedelta(days=12)), "merchant": "Japan Travel Goal", "amount": -420, "type": "transfer"},
        {"id": "b7", "date": str(TODAY - timedelta(days=16)), "merchant": "Emergency Fund", "amount": -700, "type": "transfer"},
    ],
}

WALLET_ACCOUNT = {
    "source": "GrabPay",
    "wallet_id": "grab_2219",
    "balance": 512.35,
    "currency": "MYR",
    "transactions": [
        {"id": "w1", "date": str(TODAY), "merchant": "GrabFood Nasi Lemak Co", "amount": -22.9, "type": "expense"},
        {"id": "w2", "date": str(TODAY - timedelta(days=1)), "merchant": "Grab Ride", "amount": -18.0, "type": "expense"},
        {"id": "w3", "date": str(TODAY - timedelta(days=2)), "merchant": "ZUS Coffee", "amount": -14.5, "type": "expense"},
        {"id": "w4", "date": str(TODAY - timedelta(days=4)), "merchant": "Shopee Gadget Case", "amount": -89.9, "type": "expense"},
        {"id": "w5", "date": str(TODAY - timedelta(days=6)), "merchant": "TGV Cinemas", "amount": -42.0, "type": "expense"},
        {"id": "w6", "date": str(TODAY - timedelta(days=9)), "merchant": "Tealive", "amount": -11.9, "type": "expense"},
        {"id": "w7", "date": str(TODAY - timedelta(days=10)), "merchant": "Shopee Flash Sale", "amount": -158.0, "type": "expense"},
    ],
}

LOAN_ACCOUNT = {
    "source": "LoanBook",
    "loans": [
        {
            "id": "loan_ptptn",
            "name": "PTPTN",
            "principal": 14500,
            "outstanding": 9100,
            "monthly_payment": 330,
            "interest_rate": 1.0,
            "remaining_months": 31,
        }
    ],
}

PEER_AVERAGES = {
    "Food": 0.16,
    "Rent": 0.20,
    "Transport": 0.08,
    "Shopping": 0.07,
    "Entertainment": 0.05,
    "Utilities": 0.06,
    "Loan": 0.08,
    "Goals": 0.12,
}

