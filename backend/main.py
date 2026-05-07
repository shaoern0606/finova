from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date, timedelta
import uuid

from data import BANK_ACCOUNT, GOALS, LOAN_ACCOUNT, USER, WALLET_ACCOUNT, TRANSACTIONS, reset_all_data
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
@app.post("/reset")
def reset_demo_data():
    reset_all_data()
    return {"status": "success", "message": "Demo data restored to default state"}


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


class LocationRequest(BaseModel):
    lat: float
    lng: float
    category: str = None

@app.post("/nearby-merchants")
def nearby_merchants(payload: LocationRequest):
    # Pass location and category filter to recommendation engine
    return merchant_recommendations(spending_summary(), location={"lat": payload.lat, "lng": payload.lng}, category_filter=payload.category)

@app.get("/recommendations")
def recommendations(lat: float = None, lng: float = None, category: str = None):
    loc = {"lat": lat, "lng": lng} if lat and lng else None
    return merchant_recommendations(spending_summary(), location=loc, category_filter=category)


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
    goalAllocation: list = []

def process_goal_allocation(allocations):
    for alloc in allocations:
        goal_id = alloc.get("goalId")
        amount = alloc.get("allocatedAmount", 0)
        if amount > 0:
            for goal in GOALS:
                if goal["id"] == goal_id:
                    goal["current_amount"] += amount
                    break

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
        },
        "goalAllocation": payload.goalAllocation
    }
    
    new_tx["source"] = payload.source
    TRANSACTIONS.insert(0, new_tx)
    process_goal_allocation(payload.goalAllocation)
        
    return {"status": "success", "transaction": new_tx}

class ManualTransactionRequest(BaseModel):
    merchant: str
    amount: float
    type: str = "expense"
    category: str = "Other"
    source: str = "GrabPay"
    goalAllocation: list = []

@app.post("/transactions")
def add_transaction(payload: ManualTransactionRequest):
    new_tx = {
        "id": f"tx_{uuid.uuid4().hex[:6]}",
        "date": str(date.today()),
        "merchant": payload.merchant,
        "amount": payload.amount if payload.type == "income" else -abs(payload.amount),
        "type": payload.type,
        "category": payload.category,
        "source": payload.source,
        "goalAllocation": payload.goalAllocation
    }
    TRANSACTIONS.insert(0, new_tx)
    process_goal_allocation(payload.goalAllocation)
    return {"status": "success", "transaction": new_tx}

@app.get("/transactions")
def get_transactions():
    from services.transactions import unified_transactions
    return unified_transactions()

@app.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: str):
    global TRANSACTIONS
    tx_to_delete = next((tx for tx in TRANSACTIONS if tx["id"] == tx_id), None)
    if not tx_to_delete:
        return {"status": "error", "message": "Transaction not found"}, 404
        
    # Rollback goal allocations
    if "goalAllocation" in tx_to_delete:
        for alloc in tx_to_delete["goalAllocation"]:
            goal_id = alloc.get("goalId")
            amount = alloc.get("allocatedAmount", 0)
            if amount > 0:
                for goal in GOALS:
                    if goal["id"] == goal_id:
                        goal["current_amount"] = max(0, goal["current_amount"] - amount)
                        break

    TRANSACTIONS = [tx for tx in TRANSACTIONS if tx["id"] != tx_id]
    return {"status": "success"}

class TransactionPatchRequest(BaseModel):
    amount: float = None
    merchant: str = None
    category: str = None
    goalAllocation: list = None

@app.patch("/transactions/{tx_id}")
def update_transaction(tx_id: str, payload: TransactionPatchRequest):
    tx_to_update = next((tx for tx in TRANSACTIONS if tx["id"] == tx_id), None)
    if not tx_to_update:
        return {"status": "error", "message": "Transaction not found"}, 404

    # Handle goal allocation adjustments if changed
    if payload.goalAllocation is not None:
        # Rollback old
        if "goalAllocation" in tx_to_update:
            for alloc in tx_to_update["goalAllocation"]:
                for goal in GOALS:
                    if goal["id"] == alloc.get("goalId"):
                        goal["current_amount"] = max(0, goal["current_amount"] - alloc.get("allocatedAmount", 0))
        # Apply new
        tx_to_update["goalAllocation"] = payload.goalAllocation
        process_goal_allocation(payload.goalAllocation)

    if payload.amount is not None:
        tx_to_update["amount"] = payload.amount if tx_to_update["type"] == "income" else -abs(payload.amount)
    if payload.merchant is not None:
        tx_to_update["merchant"] = payload.merchant
    if payload.category is not None:
        tx_to_update["category"] = payload.category

    return {"status": "success", "transaction": tx_to_update}

@app.get("/dashboard-summary")
def dashboard_summary():
    return intelligence_snapshot()

@app.get("/analytics")
def analytics():
    return spending_summary()

@app.get("/goals")
def get_goals():
    return GOALS

class GoalRequest(BaseModel):
    name: str
    target_amount: float
    target_date: str = ""
    category: str = "General"
    
@app.post("/goals")
def create_goal(payload: GoalRequest):
    new_goal = {
        "id": f"goal_{uuid.uuid4().hex[:6]}",
        "name": payload.name,
        "target_amount": payload.target_amount,
        "current_amount": 0.0,
        "monthly_contribution": 0.0,
        "target_date": payload.target_date or str(date.today() + timedelta(days=365)),
        "category": payload.category
    }
    GOALS.append(new_goal)
    return {"status": "success", "goal": new_goal}

class GoalPatchRequest(BaseModel):
    current_amount: float = None
    name: str = None
    target_amount: float = None

@app.patch("/goals/{goal_id}")
def update_goal(goal_id: str, payload: GoalPatchRequest):
    for goal in GOALS:
        if goal["id"] == goal_id:
            if payload.current_amount is not None:
                goal["current_amount"] = payload.current_amount
            if payload.name is not None:
                goal["name"] = payload.name
            if payload.target_amount is not None:
                goal["target_amount"] = payload.target_amount
            return {"status": "success", "goal": goal}
    return {"status": "error", "message": "Goal not found"}, 404

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: str):
    global GOALS
    original_length = len(GOALS)
    GOALS[:] = [g for g in GOALS if g["id"] != goal_id]
    if len(GOALS) < original_length:
        return {"status": "success"}
    return {"status": "error", "message": "Goal not found"}, 404

@app.get("/loans")
def get_loans():
    return LOAN_ACCOUNT["loans"]

