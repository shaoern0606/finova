import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from services.forecast import savings_forecast
from services.loan import evaluate_loan
from services.prediction import evaluate_purchase

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def llama_style_response(message, context, history=None):
    summary = context["summary"]
    balance = context["balance"]
    goals = context["goals"]
    user = context["user"]
    history = history or []
    latest_transactions = summary.get("transactions", [])[:6]
    spending_trends = summary.get("spending_intelligence", {}).get("trends", [])
    receipt_context = [
        tx for tx in latest_transactions
        if tx.get("receipt_url") or tx.get("source") in ("Receipt Scanner", "GrabPay")
    ][:3]

    # Format history for prompt
    history_str = "\n".join([f"{h['role'].upper()}: {h['text']}" for h in history[-6:]])

    prompt = f"""
You are Nova, a professional financial advisor AI for Finova OS.

Your role:
- Give clear, statistical financial advice using percentages, ratios, and projections.
- Use the provided context to calculate the mathematical impact of decisions.
- Be extremely concise. Get straight to the numbers and facts.

CONTEXT:
- Current Balance and Net Worth: {balance}
- Behavior: {context.get("behavior", {}).get("classification")}
- Goals: {goals}
- Loans: {context.get("loans", [])}
- Daily Spending: {summary["daily_average"]} RM/day
- AI Behaviour Coach Insights: {context.get("coach", {}).get("observations")}
- Monthly AI Summary: {context.get("coach", {}).get("monthly_summary")}
- Recommendations: {context.get("coach", {}).get("recommendations")}
- Travel Mode: {context.get("coach", {}).get("travel")}
- Latest Transactions: {latest_transactions}
- Spending Trends: {spending_trends}
- Recent Receipt Context: {receipt_context}
- Category Breakdown: {summary.get("category_breakdown", {})}
- Peer Benchmark: {context.get("peer", [])}
- Client Live Context: {context.get("client_live_context", {})}

RECENT CONVERSATION:
{history_str}

USER QUERY:
"{message}"

INSTRUCTIONS:
- Always explain your reasoning using statistics (e.g., impact on daily average, savings percentage, or debt ratio).
- Keep the response extremely concise and strictly data-focused. 
- If the user suggests risky spending, warn clearly with mathematical projections.
- Reference live app data when useful: latest merchant, current balance, category trend, receipt insights, or goal progress.
- If unsure, make a reasonable assumption (do NOT mention "simulated research").
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
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        text_response = response.text.strip()
        result = json.loads(text_response)
        return result
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini Error: {error_msg}")
        
        # Determine user-friendly error message based on common API errors
        if "API_KEY_HTTP_REFERRER_BLOCKED" in error_msg:
            friendly_error = "I'm having trouble connecting to my brain. Your API key has an 'HTTP Referrer' restriction. Please remove this restriction in the Google Cloud Console or AI Studio to enable my full intelligence."
        elif "quota" in error_msg.lower():
            friendly_error = "I've been thinking too much! I've reached my API quota limit for now. Please try again in a few minutes."
        else:
            friendly_error = "I'm experiencing a momentary lapse in my neural network. Please try asking again in a moment."

        return {
            "category": "error",
            "thought_process": f"API Error: {error_msg}",
            "response": friendly_error,
            "insights": ["API connectivity issue detected"],
        }


def money(value):
    return f"RM{float(value or 0):,.2f}"

