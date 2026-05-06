def salary_split(income):
    return {
        "needs": round(income * 0.5, 2),
        "wants": round(income * 0.3, 2),
        "savings": round(income * 0.2, 2),
        "message": "Salary split applied: 50% needs, 30% wants, 20% savings.",
    }


def automation_actions(summary, prediction, user):
    actions = [salary_split(user["monthly_income"])]
    if prediction["overspending_risk"] in ["medium", "high"]:
        actions.append({
            "type": "overspending_alert",
            "message": "Forecasted spending is elevated. Reduce wants budget by 12% for the next 14 days.",
        })
    if summary["category_breakdown"].get("Shopping", 0) > user["monthly_income"] * 0.07:
        actions.append({
            "type": "budget_adjustment",
            "message": "Shopping category capped at RM250 until next salary cycle.",
        })
    return actions

