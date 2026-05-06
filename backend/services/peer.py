from data import PEER_AVERAGES


def compare_to_peers(summary, user):
    income = user["monthly_income"]
    comparisons = []
    for category, amount in summary["category_breakdown"].items():
        actual = amount / max(income, 1)
        peer = PEER_AVERAGES.get(category, 0.05)
        status = "healthy"
        warning = None
        suggestion = "Maintain current level."
        if actual > peer * 1.2:
            status = "above_peer"
            warning = f"{category} is {actual:.0%} of income vs peer average {peer:.0%}."
            suggestion = f"Try reducing {category.lower()} by RM{round((actual - peer) * income, 0):,.0f} this month."
        comparisons.append({
            "category": category,
            "user_percent": round(actual * 100, 1),
            "peer_percent": round(peer * 100, 1),
            "status": status,
            "warning": warning,
            "suggestion": suggestion,
        })
    return comparisons

