def merchant_recommendations(summary):
    recommendations = []
    if summary["category_breakdown"].get("Food", 0) > 250:
        recommendations.append({
            "category": "Food",
            "merchant": "Economy Mix Rice near office",
            "benefit": "Save RM8-12 per lunch compared with delivery.",
        })
    if summary["category_breakdown"].get("Transport", 0) > 80:
        recommendations.append({
            "category": "Transport",
            "merchant": "My50 / rail pass",
            "benefit": "Lower commute cost and reduce ride-hailing spikes.",
        })
    recommendations.append({
        "category": "Cashback",
        "merchant": "GXBank debit card partners",
        "benefit": "Use eligible merchants for simulated 1% cashback.",
    })
    return recommendations

