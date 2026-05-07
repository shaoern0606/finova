import os
import json
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

def extract_receipt_data(image_path: str):
    """
    Uses Gemini 2.5 Flash to perform OCR and structured data extraction from a receipt image.
    """
    prompt = """
    Analyze this receipt image and extract the following information in structured JSON format.
    If a field is not found, return null.
    
    Fields to extract:
    - merchant: Store or company name
    - date: Transaction date in YYYY-MM-DD format
    - time: Transaction time in HH:mm format (if available)
    - subtotal: The sum of items before tax (float)
    - tax: Any SST, GST, or government tax amount (float)
    - service_charge: Any service charge amount (float)
    - total: The FINAL TOTAL PAID, including subtotal, all taxes, service charges, and rounding adjustments (float). Prioritize GRAND TOTAL, NET TOTAL, or AMOUNT PAID.
    - currency: Currency code (e.g., MYR, USD, SGD)
    - payment_method: Cash, Credit Card, E-wallet, etc.
    - category: Suggest one of [Food, Transport, Shopping, Entertainment, Utilities, Healthcare, Other]
    - items: A list of objects with 'name' and 'price' (float)
    
    Return ONLY the JSON object.
    """
    
    try:
        img = Image.open(image_path)
        response = model.generate_content([prompt, img])
        
        # Clean up the response text (sometimes it includes ```json ... ```)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        data = json.loads(text)
        
        # Additional logic for Malaysian receipts if needed
        if not data.get("currency") and "RM" in response.text:
            data["currency"] = "MYR"
            
        return {
            "parsed": data,
            "raw_text": response.text
        }
    except Exception as e:
        print(f"Error in OCR extraction: {e}")
        return {
            "parsed": {
                "merchant": "Unknown",
                "date": None,
                "subtotal": 0.0,
                "tax": 0.0,
                "service_charge": 0.0,
                "total": 0.0,
                "category": "Other",
                "items": []
            },
            "raw_text": "",
            "error": str(e)
        }

def save_transaction_from_receipt(data: dict, image_url: str):
    """
    Mocks saving the transaction to the database.
    In this demo, we'll return the structured data to be confirmed by the user.
    """
    # This will be called after user confirmation
    # For now, we just prepare the object
    transaction = {
        "merchant": data.get("merchant"),
        "date": data.get("date"),
        "amount": -abs(data.get("total", 0)),
        "type": "expense",
        "category": data.get("category", "Other"),
        "receipt_url": image_url,
        "items": data.get("items", [])
    }
    return transaction
