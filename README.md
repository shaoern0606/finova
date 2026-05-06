# FINMATE OS (FinScope Edition)

AI-Powered Open Finance Intelligence Platform MVP.

## What It Includes

- Open finance simulation for GXBank, GrabPay-style wallet, and loan data
- Unified transactions, auto-categorization, spending totals, category breakdown, and daily average
- Simulated Neo4j-style graph with User, Expense, Goal, and Loan nodes
- Rule-based AI behavior engine, credit scoring, prediction, peer comparison, automation, recommendations, loan evaluation, and chat
- React dashboard, simulation lab, and Llama-style AI assistant

## Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at the Vite URL, usually `http://localhost:5173`.

## Key API Routes

- `GET /data/all`
- `GET /data/wallet`
- `GET /data/bank`
- `GET /data/loan`
- `GET /transactions/summary`
- `GET /behavior`
- `GET /score`
- `GET /prediction`
- `GET /peer`
- `GET /automation`
- `GET /recommendations`
- `POST /forecast`
- `POST /loan/evaluate`
- `POST /purchase/intervention`
- `POST /automation/salary`
- `POST /chat`

## Demo Payloads

```json
POST /forecast
{
  "daily_savings": 10,
  "years": 10
}
```

```json
POST /loan/evaluate
{
  "amount": 12000,
  "interest": 5.5,
  "duration_months": 36
}
```

```json
POST /purchase/intervention
{
  "amount": 500,
  "merchant": "Demo Merchant"
}
```

```json
POST /chat
{
  "message": "What if I save RM10 daily?"
}
```

