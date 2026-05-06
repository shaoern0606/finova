def credit_score(summary, behavior, balance, loans, user):
    income = user["monthly_income"]
    goals_saved = summary["category_breakdown"].get("Goals", 0)
    savings_ratio = min(goals_saved / max(income, 1), 0.3) / 0.3
    consistency = 0.82
    risk_penalty = {"balanced": 4, "impulsive": 13, "at-risk": 25}[behavior["classification"]]
    monthly_debt = sum(loan["monthly_payment"] for loan in loans)
    debt_ratio = monthly_debt / max(income, 1)
    debt_penalty = min(debt_ratio * 90, 22)

    score = 55 + savings_ratio * 22 + consistency * 12 - risk_penalty - debt_penalty
    score = max(0, min(100, round(score)))

    return {
        "score": score,
        "factors": {
            "savings_ratio": round(savings_ratio, 2),
            "consistency": consistency,
            "risk_penalty": round(risk_penalty, 2),
            "debt_ratio": round(debt_ratio, 2),
        },
    }

