from datetime import date, datetime, timedelta
from collections import Counter, defaultdict
import math

FX_RATES = {
    "MYR": 1.0,
    "SGD": 3.45,
    "USD": 4.68,
    "JPY": 0.029,
    "EUR": 5.05,
    "THB": 0.127,
    "KRW": 0.0034
}

def get_exchange_rate(from_curr, to_curr="MYR"):
    if from_curr == to_curr:
        return 1.0
    return FX_RATES.get(from_curr, 1.0) / FX_RATES.get(to_curr, 1.0)

from services.transactions import enrich_transaction

def analyze_behaviour_coach(transactions, user, balance):
    today = date.today()
    # Enrich transactions first to ensure category and main_category exist
    enriched_txs = [enrich_transaction(tx) for tx in transactions]
    expenses = [tx for tx in enriched_txs if tx["amount"] < 0]
    
    # 1. Weekend vs Weekday
    weekend_spend = 0
    weekday_spend = 0
    for tx in expenses:
        tx_date = date.fromisoformat(tx["date"])
        if tx_date.weekday() >= 5: # 5=Sat, 6=Sun
            weekend_spend += abs(tx["amount"])
        else:
            weekday_spend += abs(tx["amount"])
    
    # 2. Salary Day Behaviour (Day 25)
    salary_day = user.get("salary_day", 25)
    salary_week_spend = 0
    for tx in expenses:
        tx_date = date.fromisoformat(tx["date"])
        # Check if transaction is within 3 days after salary day
        if tx_date.day >= salary_day and tx_date.day <= salary_day + 3:
            salary_week_spend += abs(tx["amount"])
            
    # 3. Recurring Merchants
    merchant_counts = Counter([tx["merchant"] for tx in expenses])
    recurring = [m for m, c in merchant_counts.items() if c >= 3]
    
    # 4. Overseas detection
    overseas_tx = [tx for tx in expenses if tx.get("currency", "MYR") != "MYR"]
    travel_total_myr = sum(abs(tx["amount"]) * get_exchange_rate(tx.get("currency", "MYR")) for tx in overseas_tx)
    
    # Generate Observations
    observations = []
    if weekend_spend > weekday_spend * 0.8: # high weekend weight
        observations.append("You tend to spend more on lifestyle and dining during weekends.")
    if salary_week_spend > (abs(sum(tx["amount"] for tx in expenses)) / 4) * 1.5:
        observations.append("Your spending increases significantly after salary credit days.")
    
    food_delivery = [tx for tx in expenses if tx.get("sub_category") == "Food Delivery"]
    if len(food_delivery) >= 3:
        observations.append(f"Food delivery is becoming a frequent habit ({len(food_delivery)} orders this month).")
    
    # 5. Monthly Summary
    top_category = "None"
    cat_totals = defaultdict(float)
    for tx in expenses:
        cat_totals[tx["category"]] += abs(tx["amount"])
    if cat_totals:
        top_category = max(cat_totals, key=cat_totals.get)
        
    total_spent = sum(abs(tx["amount"]) for tx in expenses)
    savings_perf = (user["monthly_income"] - total_spent) / user["monthly_income"] if user["monthly_income"] > 0 else 0
    
    summary = {
        "total_spent": round(total_spent, 2),
        "top_category": top_category,
        "savings_performance": f"{savings_perf*100:.1f}%",
        "insight": f"You've used { (total_spent/user['monthly_income'])*100:.1f}% of your monthly income."
    }

    # 6. Spending Limit Recommendations
    days_left = 30 - today.day if today.day < 30 else 1
    safe_balance = balance["cash"] - 500 # Keep 500 buffer
    daily_allowance = max(safe_balance / days_left, 0)
    
    recommendations = [
        f"You can safely spend around RM{daily_allowance:.0f}/day for the remaining {days_left} days.",
        f"To maintain your savings target, keep {top_category.lower()} expenses below RM{cat_totals[top_category]*0.9:.0f} next week."
    ]

    # 7. Predictions & Warnings
    daily_avg = total_spent / max((today - date.fromisoformat(transactions[-1]["date"])).days, 1)
    risk = "low"
    if daily_avg * days_left > balance["cash"]:
        risk = "high"
        warning = "Your current spending rate exceeds your available cash balance for the month."
    elif daily_avg * days_left > balance["cash"] * 0.8:
        risk = "medium"
        warning = "Spending is accelerating. You might run low on cash before next payday."
    else:
        warning = "Your spending trend is healthy and within your current balance."

    return {
        "observations": observations,
        "monthly_summary": summary,
        "recommendations": recommendations,
        "prediction": {
            "risk_level": risk,
            "warning": warning,
            "daily_allowance": round(daily_allowance, 2),
            "days_left": days_left
        },
        "travel": {
            "is_active": len(overseas_tx) > 0,
            "total_overseas_myr": round(travel_total_myr, 2),
            "currencies": list(set(tx.get("currency", "MYR") for tx in overseas_tx if tx.get("currency") != "MYR"))
        },
        "fx_rates": FX_RATES
    }
