def credit_score(summary, behavior, balance, loans, user):
    income = max(user.get("monthly_income", 5000), 1)
    
    # 1. Savings Consistency (30%)
    # Mock based on behavior or history
    savings_consistency = 85 if behavior["classification"] == "balanced" else 60 if behavior["classification"] == "impulsive" else 40
    
    # 2. Spending Stability (25%)
    # Higher if fewer large variance spikes
    spending_stability = 90 if summary["total_spending"] < income * 0.5 else 70 if summary["total_spending"] < income * 0.8 else 45
    
    # 3. Debt Ratio Score (20%)
    monthly_debt = sum(loan.get("monthly_payment", 0) for loan in loans)
    debt_ratio = monthly_debt / income
    debt_ratio_score = max(0, 100 - (debt_ratio * 200)) # 0% debt = 100, 50% debt = 0
    
    # 4. Emergency Fund Health (15%)
    # Assume liquid assets are mostly emergency fund if not allocated
    liquid_assets = balance["assets"]
    months_buffer = liquid_assets / max((summary["total_spending"] or 2000), 1)
    emergency_fund_health = min(100, (months_buffer / 6) * 100) # 6 months = 100 score
    
    # 5. Goal Progress Rate (10%)
    goals_saved = summary["category_breakdown"].get("Financial Services", 0) + summary["category_breakdown"].get("Goals", 0)
    goal_progress_rate = min(100, (goals_saved / (income * 0.2)) * 100) # saving 20% of income = 100
    
    # Calculate weighted total
    score = (
        (0.30 * savings_consistency) +
        (0.25 * spending_stability) +
        (0.20 * debt_ratio_score) +
        (0.15 * emergency_fund_health) +
        (0.10 * goal_progress_rate)
    )
    score = max(0, min(100, round(score)))

    # Determine factors
    components = [
        {"name": "Savings Consistency", "score": savings_consistency, "weight": 0.30, "desc": "Based on your monthly savings pattern."},
        {"name": "Spending Stability", "score": spending_stability, "weight": 0.25, "desc": "Variance of your daily spending."},
        {"name": "Debt Ratio Score", "score": debt_ratio_score, "weight": 0.20, "desc": f"Total debt ({debt_ratio*100:.1f}%) vs income."},
        {"name": "Emergency Fund Health", "score": emergency_fund_health, "weight": 0.15, "desc": f"{months_buffer:.1f} months of buffer available."},
        {"name": "Goal Progress Rate", "score": goal_progress_rate, "weight": 0.10, "desc": "Pace of your savings goals achievement."}
    ]
    
    # Sort to find strengths and risks
    components_sorted = sorted(components, key=lambda x: x["score"], reverse=True)
    top_factors = [c["name"] for c in components_sorted[:2]]
    risk_factor = components_sorted[-1]["name"]
    
    # Mock history insight
    trend = "increased" if score > 70 else "decreased"
    insight = f"Your score {trend} this month primarily due to your {top_factors[0].lower()}."

    return {
        "score": score,
        "breakdown": components,
        "top_factors": top_factors,
        "risk_factor": risk_factor,
        "insight": insight
    }

