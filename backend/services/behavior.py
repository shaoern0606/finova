def classify_behavior(summary, user):
    income = user["monthly_income"]
    spending = summary["total_spending"]
    shopping = summary["category_breakdown"].get("Shopping", 0)
    food = summary["category_breakdown"].get("Food", 0)
    savings_like = summary["category_breakdown"].get("Goals", 0)

    spend_ratio = spending / income
    shopping_ratio = shopping / max(spending, 1)
    savings_ratio = savings_like / income

    insights = []
    if shopping_ratio > 0.12:
        insights.append("Impulse purchases are clustering around marketplace spend.")
    if food > income * 0.08:
        insights.append("Food and cafe spending is running above a healthy monthly rhythm.")
    if savings_ratio >= 0.15:
        insights.append("Goal contributions are strong and protect the long-term plan.")
    if spend_ratio > 0.75:
        label = "at-risk"
        insights.append("Monthly spending is close to income, leaving a thin cash buffer.")
    elif shopping_ratio > 0.10:
        label = "impulsive"
    else:
        label = "balanced"
        insights.append("Spending is broadly controlled across core categories.")

    return {
        "classification": label,
        "spend_ratio": round(spend_ratio, 2),
        "savings_ratio": round(savings_ratio, 2),
        "insights": insights,
    }

