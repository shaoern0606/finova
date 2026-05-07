import { useEffect, useState, useRef, useCallback } from "react";
import { api, post } from "./api.js";
import FloatingChat from "./components/FloatingChat.jsx";
import Nav from "./components/Nav.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Simulation from "./pages/Simulation.jsx";
import ReceiptScanner from "./pages/ReceiptScanner.jsx";

const money = (value) => {
  const n = Number(value || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}RM${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(null);
  const [demoResult, setDemoResult] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending"); // pending | granted | denied
  const watchIdRef = useRef(null);
  const debounceRef = useRef(null);

  // ── fetch dashboard data ────────────────────────────────────
  async function loadDashboard() {
    const snapshot = await api("/data/all");
    setData(snapshot);
  }

  // ── fetch merchants for a given lat/lng ───────────────────
  const fetchMerchants = useCallback(async (lat, lng, category = null) => {
    try {
      const payload = { lat, lng };
      if (category && category !== "All") payload.category = category;
      const recs = await post("/nearby-merchants", payload);
      setData(prev => prev ? { ...prev, recommendations: recs } : prev);
    } catch (e) {
      console.error("[FinMate] Failed to load nearby merchants", e);
    }
  }, []);

  // ── GPS success handler (shared between watch + one-time) ──
  const onGpsSuccess = useCallback((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const loc = { lat, lng, accuracy: pos.coords.accuracy };

    setUserLocation(prev => {
      // Only update if moved > ~20m to avoid jitter
      if (prev && Math.abs(prev.lat - lat) < 0.0002 && Math.abs(prev.lng - lng) < 0.0002) {
        return prev;
      }
      return loc;
    });

    setLocationStatus("granted");

    // Debounce merchant re-fetch on movement
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMerchants(lat, lng);
    }, 500);
  }, [fetchMerchants]);

  const onGpsError = useCallback((err) => {
    console.warn("[FinMate] GPS denied or unavailable:", err.message);
    setLocationStatus("denied");
  }, []);

  // ── start GPS watching ─────────────────────────────────────
  function startGpsWatch() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    // One-time immediate fetch
    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
    // Continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      maximumAge: 15000,   // accept cached position up to 15s old
      timeout: 10000,
    });
  }

  useEffect(() => {
    loadDashboard().catch(() =>
      setDemoResult("Backend is not reachable yet. Start FastAPI on http://localhost:8000.")
    );
    startGpsWatch();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    await loadDashboard();
    if (userLocation) {
      await fetchMerchants(userLocation.lat, userLocation.lng);
    }
  }

  async function demoSalary() {
    const result = await post("/automation/salary", {});
    setDemoResult(
      `${result.message} Needs ${money(result.needs)}, wants ${money(result.wants)}, savings ${money(result.savings)}.`
    );
  }

  async function demoOverspend() {
    const result = await post("/purchase/intervention", { amount: 2200, merchant: "Luxury Phone Demo" });
    setDemoResult(result.warning);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-start md:items-center p-0 md:p-4">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-[850px] md:h-[850px] bg-[#f6fbf8] shadow-2xl relative flex flex-col overflow-hidden md:rounded-[3rem] md:border-[8px] md:border-slate-800">

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {page === "dashboard" && (
            <Dashboard
              data={data}
              onDemoSalary={demoSalary}
              onDemoOverspend={demoOverspend}
              demoResult={demoResult}
              onUpdate={load}
              onDataUpdate={setData}
              userLocation={userLocation}
              locationStatus={locationStatus}
              onRefreshMerchants={fetchMerchants}
            />
          )}
          {page === "simulation" && <Simulation data={data} />}
          {page === "scanner" && (
            <ReceiptScanner onTransactionSaved={async () => { await load(); setPage("dashboard"); }} />
          )}
          {/* Spacer so content doesn't hide behind nav */}
          <div className="h-4" />
        </div>

        {/* Fixed Bottom Navigation — outside scroll, pinned by flex */}
        <Nav active={page} onChange={setPage} />

        <FloatingChat />
      </div>
    </div>
  );
}
