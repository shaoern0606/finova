from collections import Counter, defaultdict
from datetime import date, timedelta

from data import BANK_ACCOUNT, LOAN_ACCOUNT, WALLET_ACCOUNT, TRANSACTIONS, INVESTMENTS, GOALS
from services.categories import classify, PEER_AVERAGES_HIER

CATEGORY_ALIASES = {
    "Food": "Food & Beverage",
    "Dining": "Food & Beverage",
    "Grocery": "Food & Beverage",
    "Bills": "Living Expenses",
    "Savings": "Financial Services",
}

WEEKLY_BUDGETS = {
    "Food & Beverage": 320,
    "Transport": 140,
    "Living Expenses": 520,
    "Shopping": 180,
    "Entertainment": 120,
    "Health & Wellness": 120,
    "Education": 100,
    "Travel": 180,
    "Financial Services": 250,
    "Other": 100,
}


def normalize_category(category):
    if not category:
        return None
    return CATEGORY_ALIASES.get(category, category)


def enrich_transaction(tx: dict) -> dict:
    """Add main_category, sub_category, behavioral_tag to a transaction."""
    classification = classify(tx.get("merchant", ""))
    explicit_main = normalize_category(tx.get("main_category") or tx.get("category"))
    main = explicit_main or classification["main_category"]
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
    return sorted(rows, key=lambda item: item.get("timestamp") or item["date"], reverse=True)


def _parse_date(tx):
    try:
        return date.fromisoformat(tx["date"])
    except Exception:
        return date.today()


def _expense_rows(transactions):
    return [tx for tx in transactions if tx["amount"] < 0]


def _category_totals(expenses, start=None, end=None):
    totals = defaultdict(float)
    for tx in expenses:
        tx_date = _parse_date(tx)
        if start and tx_date < start:
            continue
        if end and tx_date > end:
            continue
        totals[tx["main_category"]] += abs(tx["amount"])
    return totals


def spending_intelligence(transactions):
    expenses = _expense_rows(transactions)
    today = date.today()
    this_week_start = today - timedelta(days=6)
    previous_week_start = today - timedelta(days=13)
    previous_week_end = today - timedelta(days=7)
    this_week = _category_totals(expenses, this_week_start, today)
    previous_week = _category_totals(expenses, previous_week_start, previous_week_end)
    all_categories = sorted(set(this_week) | set(previous_week))

    insights = []
    trend_rows = []
    for category in all_categories:
        current = this_week.get(category, 0)
        previous = previous_week.get(category, 0)
        if current <= 0 and previous <= 0:
            continue
        low_baseline = 0 < previous < 25 and current > previous
        if previous > 0:
            change_pct = ((current - previous) / previous) * 100
        else:
            change_pct = 100 if current > 0 else 0

        if abs(change_pct) < 10:
            direction = "stable"
            message = f"{category} expenses remain stable this week."
        elif low_baseline:
            direction = "accelerating"
            message = f"{category} spending is accelerating from a low baseline this week."
        elif change_pct > 0:
            direction = "accelerating" if change_pct >= 35 else "increased"
            message = f"{category} spending {direction} {abs(change_pct):.0f}% this week."
        else:
            direction = "decreased"
            message = f"{category} spending decreased {abs(change_pct):.0f}% this week."

        weekly_budget = WEEKLY_BUDGETS.get(category, 120)
        budget_usage = (current / weekly_budget) * 100 if weekly_budget else 0
        severity = "warning" if budget_usage >= 85 or change_pct >= 35 else "caution" if budget_usage >= 65 or change_pct >= 15 else "tip"
        insights.append({
            "type": severity,
            "tag": direction,
            "category": category,
            "message": message,
            "current_week": round(current, 2),
            "previous_week": round(previous, 2),
            "change_pct": round(change_pct, 1),
            "weekly_budget": weekly_budget,
            "budget_usage_pct": round(budget_usage, 1),
        })
        trend_rows.append({
            "category": category,
            "current_week": round(current, 2),
            "previous_week": round(previous, 2),
            "change_pct": round(change_pct, 1),
            "status": direction,
        })

    insights.sort(key=lambda item: (item["type"] != "warning", -abs(item["change_pct"]), -item["current_week"]))
    return {
        "insights": insights[:5],
        "trends": trend_rows,
        "weekly_budgets": WEEKLY_BUDGETS,
    }


def receipt_ai_analysis(transaction, transactions, balance):
    tx = enrich_transaction(transaction)
    category = tx["main_category"]
    amount = abs(tx["amount"])
    merchant = tx.get("merchant", "This merchant")
    expenses = _expense_rows([enrich_transaction(row) for row in transactions])
    prior_expenses = [row for row in expenses if row["id"] != tx["id"]]
    category_rows = [row for row in prior_expenses if row["main_category"] == category]
    merchant_rows = [row for row in expenses if row.get("merchant", "").lower() == merchant.lower()]

    avg_category = sum(abs(row["amount"]) for row in category_rows) / len(category_rows) if category_rows else 0
    today = date.today()
    week_start = today - timedelta(days=6)
    category_week_total = sum(
        abs(row["amount"])
        for row in expenses
        if row["main_category"] == category and _parse_date(row) >= week_start
    )
    weekly_budget = WEEKLY_BUDGETS.get(category, 120)
    budget_usage = (category_week_total / weekly_budget) * 100 if weekly_budget else 0

    messages = []
    if avg_category and amount > avg_category * 1.15:
        messages.append(f"This purchase is {((amount - avg_category) / avg_category) * 100:.0f}% above your average {category.lower()} expense.")
    elif avg_category:
        messages.append(f"This purchase is within your average {category.lower()} range of RM{avg_category:.2f}.")
    else:
        messages.append(f"This is your first tracked {category.lower()} purchase in the current dataset.")

    current_month_rows = [
        row for row in merchant_rows
        if _parse_date(row).year == today.year and _parse_date(row).month == today.month
    ]
    if len(current_month_rows) > 1:
        messages.append(f"You've visited {merchant} {len(current_month_rows)} times this month.")
    else:
        messages.append(f"{merchant} is a new merchant in this month's spending pattern.")

    messages.append(f"Your {category.lower()} budget usage is now at {budget_usage:.0f}% for the week.")
    messages.append(f"Current balance after this receipt is RM{balance['assets']:,.2f}.")
    return {
        "merchant": merchant,
        "amount": amount,
        "category": category,
        "average_category_spend": round(avg_category, 2),
        "merchant_visits_this_month": len(current_month_rows),
        "weekly_budget": weekly_budget,
        "weekly_budget_usage_pct": round(budget_usage, 1),
        "insights": messages,
    }


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

    dynamic_intelligence = spending_intelligence(transactions)
    behavioral_insights.extend(dynamic_intelligence["insights"])

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
        "spending_intelligence": dynamic_intelligence,
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
