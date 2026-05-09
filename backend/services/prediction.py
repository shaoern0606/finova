def predict(summary, balance, user):
    daily_average = max(summary["daily_average"], 1)
    liquid_balance = balance["assets"]
    days_until_low_balance = max(int((liquid_balance - 1000) / daily_average), 0)
    monthly_spend_projection = daily_average * 30
    overspending_risk = "high" if monthly_spend_projection > user["monthly_income"] * 0.8 else "medium"
    if monthly_spend_projection < user["monthly_income"] * 0.6:
        overspending_risk = "low"
    projected_monthly_savings = user["monthly_income"] - monthly_spend_projection

    return {
        "days_until_low_balance": days_until_low_balance,
        "overspending_risk": overspending_risk,
        "monthly_spend_projection": round(monthly_spend_projection, 2),
        "projected_monthly_savings": round(projected_monthly_savings, 2),
    }


def evaluate_purchase(amount, summary, balance):
    future_balance = balance["assets"] - amount
    days_after_purchase = max(int((future_balance - 1000) / max(summary["daily_average"], 1)), 0)
    warning = None
    if future_balance < 1000:
        warning = "Critical: this purchase pushes your buffer below RM1,000."
    elif days_after_purchase < 30:
        warning = "Caution: this purchase leaves less than 30 days before a low-balance event."
    elif days_after_purchase < 60:
        warning = "Purchase looks affordable, but watch for any unexpected bills."
    else:
        warning = "Purchase looks affordable based on your current balance."
    return {
        "purchase_amount": amount,
        "future_balance": round(future_balance, 2),
        "days_until_low_balance": days_after_purchase,
        "warning": warning,
    }

