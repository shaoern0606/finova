# 🌌 Finova
**The Intelligent Financial Operating System**

Finova is a next-generation personal finance platform designed to transform raw transaction data into actionable behavioral intelligence. Built with a "premium-first" neo-minimalist aesthetic, it combines real-time graph analytics, AI-powered coaching, and predictive simulations to give users total mastery over their money.

---

## 📖 Project Overview
Finova is not just a tracker; it's a financial co-pilot. While traditional banking apps focus on historical logs, Finova focuses on **future outcomes** and **behavioral patterns**. By analyzing the "why" behind your spending, it helps you break bad habits and reach your goals faster through a unified, high-fidelity intelligence layer.

## ⚠️ Problem Statement
Modern consumers face "Financial Noise"—a constant stream of digital transactions that makes it difficult to:
1.  **Understand Patterns**: Users often don't realize they spend 40% more on weekends or are "delivery-dependent."
2.  **Predict Impact**: It's hard to visualize how a single luxury purchase today affects your ability to pay for a home in 2 years.
3.  **Manage Global Spending**: Frequent travelers struggle to track real-time FX impact and localized spending habits.
4.  **Actionable Advice**: Generic "save more" advice fails to address individual behavioral biases.

## 💡 The Solution: Finova Intelligence
Finova introduces an intelligent layer between you and your bank. It uses a **Financial Graph** to map relationships between income, expenses, and goals, providing:
*   **Behavioral Economics**: Identifies specific spending archetypes (e.g., "The Impulse Shopper").
*   **Predictive Simulations**: A "What-If" lab to test major purchases before they happen.
*   **Live AI Coaching**: A context-aware advisor (Nova) that knows your habits better than you do.

---

## ✨ Key Features

### 🧠 AI Behaviour Coach
*   **Pattern Recognition**: Detects "Weekend Spikes," "Salary Day Dependency," and "Subscription Bloat."
*   **Safe Daily Limit**: Dynamically calculates your safe spending pace based on your balance and goals.
*   **Travel Mode**: Automatic detection of overseas spending with live FX conversion and localized impact analysis.

### 🧪 Simulation Lab
*   **Overspending Interventions**: Test "What If" scenarios and see how it affects your net worth in 6 months.
*   **Salary Automation**: Visualizes the 50/30/20 rule application as soon as your paycheck hits.

### 📍 Smart Map Intelligence
*   **Geo-Fenced Savings**: Discover cost-saving merchant alternatives near your current location.
*   **Contextual Recommendations**: AI-driven suggestions for dining, transport, and shopping based on your historical behavior.

### 📊 Intelligence Cockpit
*   **Financial Graph**: A unified view of Assets, Net Worth, Liabilities, and Investments.
*   **Spending Trends**: Interactive Area charts and Top-Merchant widgets to visualize your lifestyle inflation.
*   **Savings Goals**: Progress tracking for multiple financial milestones with auto-allocation from income.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, Recharts (Data Viz), Lucide React (Icons).
*   **Backend**: FastAPI (Python), Rule-based AI Engine, Behavioral Economics Heuristics.
*   **Intelligence**: Simulated Graph Data Model, OCR Receipt Processing, Google Gemini API.

---

## 🚀 Setup Requirements

### Prerequisites
*   **Python 3.9+**
*   **Node.js 18+**
*   **Google Gemini API Key**

### 1. Clone & Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. .env File Instruction
Create a `.env` file in the `backend/` directory with the following variables:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Running the Project
```bash
# Start Backend
cd backend
uvicorn main:app --reload

# Start Frontend
cd frontend
npm run dev
```

---

## 📂 Project Structure
```text
├── backend/
│   ├── services/      # AI Coach, Peer Analytics, FX Engine, OCR
│   ├── main.py        # FastAPI Endpoints & App Initialization
│   └── data.py        # Seed Transactions, Goals, & Graph Nodes
├── frontend/
│   ├── src/
│   │   ├── pages/     # Dashboard, Simulation, Investments, Scanner
│   │   ├── components/# SmartMap, Charts, StatusBar, ScoreRing
│   │   └── App.jsx    # Main Layout & Navigation Logic
```

---

## 🗺️ Future Roadmap
- [ ] **Multi-Bank Sync**: Direct API integration with major banks (Open Banking).
- [ ] **Shared Goals**: Collaborative savings goals for couples or families.
- [ ] **Crypto Insights**: Integration of digital asset portfolios into the Financial Graph.
- [ ] **AI Voice Assistant**: Hands-free financial coaching via voice commands.
- [ ] **Smart Budgeting 2.0**: Auto-adjusting budget limits based on daily market volatility.
