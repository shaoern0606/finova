def savings_forecast(daily_savings, years, annual_growth=0.03):
    principal = daily_savings * 365 * years
    monthly = daily_savings * 30.4167
    months = years * 12
    monthly_rate = annual_growth / 12
    if monthly_rate:
        future_value = monthly * (((1 + monthly_rate) ** months - 1) / monthly_rate)
    else:
        future_value = principal
    return {
        "daily_savings": daily_savings,
        "years": years,
        "total_savings": round(principal, 2),
        "projected_growth": round(future_value - principal, 2),
        "projected_value": round(future_value, 2),
        "message": f"If you save RM{daily_savings}/day, you set aside RM{principal:,.0f} in {years} years.",
    }

