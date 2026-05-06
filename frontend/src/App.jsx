import { useEffect, useState } from "react";
import { api, post } from "./api.js";
import Nav from "./components/Nav.jsx";
import Chat from "./pages/Chat.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Simulation from "./pages/Simulation.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(null);
  const [demoResult, setDemoResult] = useState("");

  async function load() {
    const snapshot = await api("/data/all");
    setData(snapshot);
  }

  useEffect(() => {
    load().catch(() => setDemoResult("Backend is not reachable yet. Start FastAPI on http://localhost:8000."));
  }, []);

  async function demoSalary() {
    const result = await post("/automation/salary", {});
    setDemoResult(`${result.message} Needs RM${result.needs}, wants RM${result.wants}, savings RM${result.savings}.`);
  }

  async function demoOverspend() {
    const result = await post("/purchase/intervention", { amount: 2200, merchant: "Luxury Phone Demo" });
    setDemoResult(result.warning);
  }

  return (
    <div className="min-h-screen bg-[#f6fbf8] pb-20 md:pb-0">
      <Nav active={page} onChange={setPage} />
      {page === "dashboard" && <Dashboard data={data} onDemoSalary={demoSalary} onDemoOverspend={demoOverspend} demoResult={demoResult} />}
      {page === "simulation" && <Simulation data={data} />}
      {page === "chat" && <Chat />}
    </div>
  );
}

