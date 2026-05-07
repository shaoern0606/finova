from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data import BANK_ACCOUNT, GOALS, LOAN_ACCOUNT, USER, WALLET_ACCOUNT
from graph import build_graph
from services.automation import automation_actions, salary_split
from services.behavior import classify_behavior
from services.chat import llama_style_response
from services.forecast import savings_forecast
from services.loan import evaluate_loan
from services.peer import compare_to_peers
from services.prediction import evaluate_purchase, predict
from services.recommendation import merchant_recommendations
from services.scoring import credit_score
from services.transactions import combined_balance, spending_summary
from services.ocr import extract_receipt_data, save_transaction_from_receipt
from fastapi import File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import uuid
import os


app = FastAPI(title="FINMATE OS - FinScope Edition", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads/receipts"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


class ForecastRequest(BaseModel):
    daily_savings: float
    years: int


class LoanRequest(BaseModel):
    amount: float
    interest: float
    duration_months: int


class PurchaseRequest(BaseModel):
    amount: float
    merchant: str = "Demo Merchant"


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


def intelligence_snapshot():
    summary = spending_summary()
    balance = combined_balance()
    behavior = classify_behavior(summary, USER)
    score = credit_score(summary, behavior, balance, LOAN_ACCOUNT["loans"], USER)
    prediction = predict(summary, balance, USER)
    graph = build_graph(summary["category_breakdown"])
    return {
        "user": USER,
        "balance": balance,
        "summary": summary,
        "behavior": behavior,
        "score": score,
        "prediction": prediction,
        "goals": GOALS,
        "loans": LOAN_ACCOUNT["loans"],
        "graph": graph.as_dict(),
        "peer": compare_to_peers(summary, USER),
        "automation": automation_actions(summary, prediction, USER),
        "recommendations": merchant_recommendations(summary),
    }


@app.get("/")
def root():
    return {"name": "FINMATE OS (FinScope Edition)", "status": "online"}


@app.get("/data/bank")
def bank():
    return BANK_ACCOUNT


@app.get("/data/wallet")
def wallet():
    return WALLET_ACCOUNT


@app.get("/data/loan")
def loan():
    return LOAN_ACCOUNT


@app.get("/data/all")
def all_data():
    return intelligence_snapshot()


@app.get("/transactions/summary")
def transactions_summary():
    return spending_summary()


@app.get("/behavior")
def behavior():
    return classify_behavior(spending_summary(), USER)


@app.get("/score")
def score():
    snapshot = intelligence_snapshot()
    return snapshot["score"]


@app.get("/prediction")
def prediction():
    return predict(spending_summary(), combined_balance(), USER)


@app.get("/peer")
def peer():
    return compare_to_peers(spending_summary(), USER)


@app.post("/forecast")
def forecast(payload: ForecastRequest):
    return savings_forecast(payload.daily_savings, payload.years)


@app.post("/loan/evaluate")
def loan_evaluate(payload: LoanRequest):
    return evaluate_loan(payload.amount, payload.interest, payload.duration_months, GOALS, USER)


@app.post("/purchase/intervention")
def purchase_intervention(payload: PurchaseRequest):
    result = evaluate_purchase(payload.amount, spending_summary(), combined_balance())
    result["merchant"] = payload.merchant
    return result


@app.get("/automation")
def automation():
    snapshot = intelligence_snapshot()
    return snapshot["automation"]


@app.post("/automation/salary")
def salary_automation():
    return salary_split(USER["monthly_income"])


@app.get("/recommendations")
def recommendations():
    return merchant_recommendations(spending_summary())


@app.post("/chat")
def chat(payload: ChatRequest):
    return llama_style_response(payload.message, intelligence_snapshot(), payload.history)


@app.post("/ocr/upload")
async def ocr_upload(file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process OCR
    extracted_data = extract_receipt_data(file_path)
    
    return {
        "status": "success",
        "file_url": f"/uploads/receipts/{file_name}",
        "extracted_data": extracted_data
    }


class TransactionConfirmRequest(BaseModel):
    merchant: str
    date: str
    amount: float
    category: str
    source: str = "GrabPay"
    receipt_url: str = None
    items: list = []
    raw_text: str = ""
    custom_category: str = ""
    tax: float = 0.0
    service_charge: float = 0.0

@app.post("/ocr/confirm")
async def ocr_confirm(payload: TransactionConfirmRequest):
    final_category = payload.custom_category if payload.category == "Other" and payload.custom_category else payload.category
    
    new_tx = {
        "id": f"ocr_{uuid.uuid4().hex[:6]}",
        "date": payload.date,
        "merchant": payload.merchant,
        "amount": -abs(payload.amount),
        "type": "expense",
        "category": final_category,
        "receipt_url": payload.receipt_url,
        "items": payload.items,
        "raw_text": payload.raw_text,
        "tax_metadata": {
            "tax": payload.tax,
            "service_charge": payload.service_charge
        }
    }
    
    if payload.source == "GXBank":
        BANK_ACCOUNT["transactions"].insert(0, new_tx)
        BANK_ACCOUNT["balance"] += new_tx["amount"]
    else:
        WALLET_ACCOUNT["transactions"].insert(0, new_tx)
        WALLET_ACCOUNT["balance"] += new_tx["amount"]
        
    return {"status": "success", "transaction": new_tx}

