from collections import defaultdict
from datetime import date

from data import BANK_ACCOUNT, LOAN_ACCOUNT, WALLET_ACCOUNT


CATEGORY_RULES = {
    "Food": ["food", "nasi", "grocer", "coffee", "tealive"],
    "Rent": ["residence", "rent"],
    "Transport": ["grab ride", "mrt", "lrt", "petrol"],
    "Shopping": ["shopee", "gadget", "flash sale"],
    "Entertainment": ["cinema", "tgv", "netflix"],
    "Utilities": ["tenaga", "utility", "water", "internet"],
    "Loan": ["ptptn", "loan"],
    "Goals": ["goal", "emergency fund"],
}


def categorize(merchant):
    text = merchant.lower()
    for category, keywords in CATEGORY_RULES.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "Other"


def unified_transactions():
    rows = []
    for tx in BANK_ACCOUNT["transactions"]:
        rows.append({**tx, "source": BANK_ACCOUNT["source"], "category": categorize(tx["merchant"])})
    for tx in WALLET_ACCOUNT["transactions"]:
        rows.append({**tx, "source": WALLET_ACCOUNT["source"], "category": categorize(tx["merchant"])})
    return sorted(rows, key=lambda item: item["date"], reverse=True)


def spending_summary():
    transactions = unified_transactions()
    expenses = [tx for tx in transactions if tx["amount"] < 0]
    total_spending = abs(sum(tx["amount"] for tx in expenses))
    breakdown = defaultdict(float)

    for tx in expenses:
        breakdown[tx["category"]] += abs(tx["amount"])

    oldest = min(date.fromisoformat(tx["date"]) for tx in transactions)
    days = max((date.today() - oldest).days + 1, 1)
    daily_average = total_spending / days

    return {
        "transactions": transactions,
        "total_spending": round(total_spending, 2),
        "category_breakdown": {key: round(value, 2) for key, value in breakdown.items()},
        "daily_average": round(daily_average, 2),
    }


def combined_balance():
    debt = sum(loan["outstanding"] for loan in LOAN_ACCOUNT["loans"])
    assets = BANK_ACCOUNT["balance"] + WALLET_ACCOUNT["balance"]
    return {"assets": round(assets, 2), "debt": round(debt, 2), "net_worth": round(assets - debt, 2)}

