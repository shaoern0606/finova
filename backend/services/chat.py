import os
import json
import google.generativeai as genai
from services.forecast import savings_forecast
from services.loan import evaluate_loan
from services.prediction import evaluate_purchase

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def llama_style_response(message, context, history=None):
    summary = context["summary"]
    balance = context["balance"]
    goals = context["goals"]
    user = context["user"]
    history = history or []

    # Format history for prompt
    history_str = "\n".join([f"{h['role'].upper()}: {h['text']}" for h in history[-6:]])

    prompt = f"""

You are Nova, a professional financial advisor AI for FINMATE OS.

Your role:

- Give clear, data-driven financial advice
- Use the provided financial context
- Be cautious with risky decisions
- Stay concise and structured

CONTEXT:

- Net Worth: {balance}

- Behavior: {context.get("behavior", {}).get("classification")}

- Goals: {goals}

- Loans: {context.get("loans", [])}

- Daily Spending: {summary["daily_average"]} RM/day

- Peer Benchmark: {context.get("peer", [])}

RECENT CONVERSATION:

{history_str}

USER QUERY:

"{message}"

INSTRUCTIONS:

- Use context to personalize advice

- If user suggests risky spending, warn clearly

- If unsure, make a reasonable assumption (do NOT mention "simulated research")

- Keep response practical and actionable

- DO NOT include markdown or explanation outside JSON

Respond ONLY in valid JSON:

{{

  "category": "advice | warning | forecast | loan | general",

  "response": "Clear and professional financial advice",

  "insights": [

    "Key financial insight 1",

    "Key financial insight 2"

  ]

}}

"""

    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        # Clean potential markdown
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        elif "```" in text_response:
            text_response = text_response.split("```")[1].split("```")[0].strip()
            
        result = json.loads(text_response)
        return result
    except Exception as e:
        # Fallback to original logic if API fails
        text = message.lower()
        if "rm10" in text or "10 daily" in text or "save" in text:
            result = savings_forecast(10, 10)
            return {
                "category": "forecast",
                "response": f"Based on your savings goals, {result['message'].lower()} With a modest 3% growth, that could reach RM{result['projected_value']:,.0f} over a decade.",
                "insights": ["Goal-based trajectory", "3% growth simulation", "Daily RM10 habit"],
            }
        if "loan" in text:
            result = evaluate_loan(12000, 5.5, 36, goals, user)
            return {
                "category": "loan",
                "response": f"I'd advise caution here. A RM{result['monthly_payment']:,.0f} monthly payment is significant. {result['message']}",
                "insights": ["Debt-to-income impact", "Goal delay calculation", "Interest rate node"],
            }
        if "afford" in text or "buy" in text or "purchase" in text or "car" in text or "phone" in text or "laptop" in text:
            # Architect-style fallback reasoning
            amount = 500
            item = "this purchase"
            thought = "Checking balance against asset nodes... Identifying conflicts with savings goals..."
            
            if "car" in text:
                amount = 80000
                item = "a car"
                response = f"Before we look at RM{amount:,} for a car, I have to ask: Is this a necessity or a lifestyle upgrade? Your current net worth is {money(balance['net_worth'])}. Adding a car loan would significantly increase your 'Debt' edge and likely push your 'Emergency Fund' goal back by several years. Have you considered the insurance and maintenance nodes in this graph?"
                thought = "User queried big-ticket item (Car). High debt-to-income risk detected. Net worth insufficient for cash purchase. Loan impact: High."
            elif "tea" in text or "coffee" in text:
                amount = 15 * (int(''.join(filter(str.isdigit, text))) if any(char.isdigit() for char in text) else 1)
                response = f"While RM{amount} for tea won't break the bank, your 'Impulsive' spending category is already at {context.get('behavior', {}).get('shopping_ratio', 0)*100:.0f}%. If we keep adding these small edges, your 'Japan Travel' goal will suffer. Is there a cheaper alternative you'd consider today?"
                thought = "Micro-spending detected. Accumulation risk check. Checking goal node: Japan Travel."
            else:
                response = f"I see you're thinking about a RM{amount} purchase. Looking at your current daily spend velocity of {money(summary['daily_average'])}, this is affordable, but it reduces your 'Days until low balance' from {context.get('prediction', {}).get('days_until_low_balance', 0)} down by a few days. Does this purchase align with your City-Living priorities?"
                thought = "Standard affordability check. Velocity check. Buffer impact: Minimal."

            return {
                "category": "architect_fallback",
                "thought_process": thought,
                "response": response,
                "insights": ["Cash buffer check", "Goal collision check"],
            }
        
        return {
            "category": "coach",
            "thought_process": "General inquiry handling. Providing overview of navigation capabilities.",
            "response": "I'm Nova, your Financial Architect. I don't just calculate numbers; I evaluate the relationships between your goals, loans, and spending habits. Ask me about a potential purchase or your progress towards your Japan trip.",
            "insights": [],
        }


def money(value):
    return f"RM{float(value or 0):,.2f}"

