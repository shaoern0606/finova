from collections import defaultdict
from datetime import date

from data import BANK_ACCOUNT, LOAN_ACCOUNT, WALLET_ACCOUNT, TRANSACTIONS, INVESTMENTS, GOALS
from services.categories import classify, PEER_AVERAGES_HIER


def enrich_transaction(tx: dict) -> dict:
    """Add main_category, sub_category, behavioral_tag to a transaction."""
    classification = classify(tx.get("merchant", ""))
    # Preserve explicit category set by OCR, but always add sub-fields
    main = tx.get("main_category") or classification["main_category"]
    sub = tx.get("sub_category") or classification["sub_category"]
    tag = tx.get("behavioral_tag") or classification["behavioral_tag"]
    # Backwards-compat: keep flat "category" field pointing to main_category
    return {
        **tx,
        "category": main,
        "main_category": main,
        "sub_category": sub,
        "behavioral_tag": tag,
    }


def unified_transactions():
    rows = [enrich_transaction(tx) for tx in TRANSACTIONS]
    return sorted(rows, key=lambda item: item["date"], reverse=True)


def spending_summary():
    transactions = unified_transactions()
    expenses = [tx for tx in transactions if tx["amount"] < 0]
    total_spending = abs(sum(tx["amount"] for tx in expenses))

    # Main category breakdown (flat, for backward compat)
    main_breakdown = defaultdict(float)
    # Sub-category breakdown
    sub_breakdown = defaultdict(lambda: defaultdict(float))
    # Behavioral tag counts
    tag_counts = defaultdict(int)

    for tx in expenses:
        main = tx["main_category"]
        sub = tx["sub_category"]
        tag = tx.get("behavioral_tag")
        amt = abs(tx["amount"])

        main_breakdown[main] += amt
        sub_breakdown[main][sub] += amt
        if tag:
            tag_counts[tag] += 1

    if transactions:
        oldest = min(date.fromisoformat(tx["date"]) for tx in transactions)
        days = max((date.today() - oldest).days + 1, 1)
    else:
        days = 1
    daily_average = total_spending / days

    # Build behavioral insights
    behavioral_insights = []
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        if tag == "daily_habit" and count >= 3:
            behavioral_insights.append({
                "type": "warning",
                "tag": tag,
                "message": f"Daily habit detected across {count} transactions — consider reviewing frequency."
            })
        elif tag == "delivery_dependency" and count >= 2:
            behavioral_insights.append({
                "type": "warning",
                "tag": tag,
                "message": f"High food delivery dependency ({count} orders) — cooking or hawker food could save 40–60%."
            })
        elif tag == "impulse" and count >= 2:
            behavioral_insights.append({
                "type": "caution",
                "tag": tag,
                "message": f"{count} impulse purchases detected — review before next purchase."
            })
        elif tag == "convenience_spending" and count >= 2:
            behavioral_insights.append({
                "type": "tip",
                "tag": tag,
                "message": f"Frequent ride-hailing ({count}x) — public transit could save RM10–20 per trip."
            })

    return {
        "transactions": transactions,
        "total_spending": round(total_spending, 2),
        "category_breakdown": {k: round(v, 2) for k, v in main_breakdown.items()},
        "sub_category_breakdown": {
            main: {sub: round(amt, 2) for sub, amt in subs.items()}
            for main, subs in sub_breakdown.items()
        },
        "behavioral_tag_counts": dict(tag_counts),
        "behavioral_insights": behavioral_insights,
        "daily_average": round(daily_average, 2),
    }


def combined_balance():
    debt = sum(loan["outstanding"] for loan in LOAN_ACCOUNT["loans"])
    cash = sum(tx["amount"] for tx in TRANSACTIONS)
    investment_value = sum(inv["current_value"] for inv in INVESTMENTS)
    savings_total = sum(goal["current_amount"] for goal in GOALS)
    
    # Net Worth = Savings + Investments + Cash - Debt
    # (Note: In this app, 'cash' from transactions already includes what's allocated to goals?
    #  Actually, usually goals are subset of cash, but here we treat them as separate 'buckets' for the UI)
    
    return {
        "cash": round(cash, 2),
        "savings": round(savings_total, 2),
        "debt": round(debt, 2),
        "investments": round(investment_value, 2),
        "assets": round(cash + savings_total + investment_value, 2),
        "net_worth": round(cash + savings_total + investment_value - debt, 2)
    }
