from math import ceil


def evaluate_loan(amount, interest, duration_months, goals, user):
    monthly_rate = (interest / 100) / 12
    if monthly_rate:
        payment = amount * monthly_rate / (1 - (1 + monthly_rate) ** -duration_months)
    else:
        payment = amount / duration_months

    available_goal_cash = user["monthly_income"] * 0.2
    goal_delay_months = ceil(payment / max(available_goal_cash, 1) * duration_months * 0.35)
    first_goal = goals[0]

    return {
        "loan_amount": amount,
        "monthly_payment": round(payment, 2),
        "total_repayment": round(payment * duration_months, 2),
        "impact_on_savings": round(payment, 2),
        "goal_delay_months": goal_delay_months,
        "message": f"This loan delays your {first_goal['name']} goal by about {goal_delay_months} months.",
    }

