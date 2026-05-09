import { useEffect, useState, useRef, useCallback } from "react";
import { api, post } from "./api.js";
import FloatingChat from "./components/FloatingChat.jsx";
import Nav from "./components/Nav.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Simulation from "./pages/Simulation.jsx";
import ReceiptScanner from "./pages/ReceiptScanner.jsx";
import Investments from "./pages/Investments.jsx";
import Profile from "./pages/Profile.jsx";
import StatusBar from "./components/StatusBar.jsx";

const money = (value) => {
  const n = Number(value || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}RM${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("finmate_session") || "null");
    } catch {
      return null;
    }
  });
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
    if (!session) return;
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
  }, [session]);

  function handleAuth(nextSession) {
    localStorage.setItem("finmate_session", JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function signOut() {
    localStorage.removeItem("finmate_session");
    setSession(null);
    setPage("dashboard");
  }

  async function load() {
    await loadDashboard();
    if (userLocation) {
      await fetchMerchants(userLocation.lat, userLocation.lng);
    }
  }

  async function demoSalary() {
    const result = await post("/automation/salary", {});
    if (result.snapshot) setData(result.snapshot);
    setDemoResult(
      `${result.message} Needs ${money(result.needs)}, wants ${money(result.wants)}, savings ${money(result.savings)}.`
    );
  }

  async function demoOverspend() {
    const result = await post("/purchase/intervention", { amount: 2200, merchant: "Luxury Phone Demo" });
    setDemoResult(result.warning);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#4c1d95_0%,#1e1033_42%,#090714_100%)] flex justify-center items-start md:items-center p-0 md:p-4">
      {/* Mobile Frame Container */}
      <div className="w-[500px] h-[1050px] bg-[#f6fbf8] shadow-[0_30px_80px_rgba(0,0,0,0.35)] relative flex flex-col overflow-hidden mx-auto rounded-[45px] border-[12px] border-black">
        {/*<div className="w-full max-w-md h-screen md:h-[850px] md:max-h-[calc(100vh-2rem)] bg-[#f7f4ff] shadow-[0_30px_90px_rgba(0,0,0,0.36)] relative flex flex-col overflow-hidden md:rounded-[3rem] md:border-[8px] md:border-white/10">*/}
        <StatusBar variant={!session ? "dark" : (page === "dashboard" || page === "investments" ? "light" : "dark")} />
        {!session ? (
          <AuthPage onAuth={handleAuth} />
        ) : (
          <>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative pb-24">
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
                  onSignOut={signOut}
                />
              )}
              {page === "simulation" && <Simulation data={data} onDataUpdate={setData} />}
              {page === "investments" && <Investments data={data} onUpdate={load} onDataUpdate={setData} />}
              {page === "scanner" && (
                <ReceiptScanner
                  data={data}
                  onTransactionSaved={async (result) => {
                    if (result?.snapshot) setData(result.snapshot);
                    if (result?.analysis?.insights?.length) {
                      setDemoResult(result.analysis.insights.join(" "));
                    }
                    await loadDashboard();
                    setPage("dashboard");
                  }}
                />
              )}
              {page === "profile" && (
                <Profile onSignOut={signOut} />
              )}
            </div>

            <Nav active={page} onChange={setPage} />

            <FloatingChat data={data} />
          </>
        )}
      </div>
    </div>
  );
}
