import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useRef } from "react";
import { Info, MapPin, X, Navigation, AlertCircle, RefreshCw } from "lucide-react";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Color → css hex for Leaflet (can't use Tailwind inside divIcon)
const COLOR_MAP = {
  green: { bg: "#10b981", border: "#ffffff" },
  yellow: { bg: "#f59e0b", border: "#ffffff" },
  red: { bg: "#ef4444", border: "#ffffff" },
};

const createCustomIcon = (color) => {
  const { bg } = COLOR_MAP[color] || COLOR_MAP.yellow;
  const html = `
    <div style="
      width:28px; height:28px; border-radius:50%;
      background:${bg}; border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      position:relative;
    ">
      <div style="
        position:absolute; bottom:-6px; left:50%;
        transform:translateX(-50%) rotate(45deg);
        width:8px; height:8px; background:${bg};
      "></div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [28, 34], iconAnchor: [14, 34], popupAnchor: [0, -34] });
};

const userIcon = L.divIcon({
  html: `<div style="
    width:18px; height:18px; border-radius:50%;
    background:#3b82f6; border:3px solid white;
    box-shadow:0 0 0 4px rgba(59,130,246,0.3);
  "></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Fly map to new center when location changes
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    if (!prevCenter.current ||
        Math.abs(prevCenter.current[0] - center[0]) > 0.0001 ||
        Math.abs(prevCenter.current[1] - center[1]) > 0.0001) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 });
      prevCenter.current = center;
    }
  }, [center, map, zoom]);
  return null;
}

export default function SmartMap({
  recommendations = [],
  location = null,
  locationStatus = "pending",
  categoryFilter,
  setCategoryFilter,
  onRefreshMerchants,
}) {
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const CATEGORIES = [
    "All",
    "Food & Beverage", "Transport", "Shopping", "Health & Wellness",
    "Entertainment", "Living Expenses", "Education", "Travel",
    "Local Hawker", "Street Food", "Caf\u00e9 / Coffee", "Fast Food", "Food Delivery",
    "Grocery", "Convenience Store", "Night Market",
    "Public Transport", "Ride-hailing", "Fuel",
    "Pharmacy", "Medical / Clinic", "Fitness / Gym",
    "Fashion / Clothing", "Movies",
  ];
  const [isRefreshing, setIsRefreshing] = useState(false);

  const center = location ? [location.lat, location.lng] : [3.1330, 101.6870];

  const filteredRecs = categoryFilter === "All"
    ? recommendations
    : recommendations.filter(r =>
        r.category === categoryFilter || r.sub_category === categoryFilter
      );

  // Re-fetch when category filter changes
  useEffect(() => {
    if (!location || !onRefreshMerchants) return;
    const cat = categoryFilter !== "All" ? categoryFilter : null;
    onRefreshMerchants(location.lat, location.lng, cat);
  }, [categoryFilter]); // eslint-disable-line

  async function handleRefresh() {
    if (!location || !onRefreshMerchants) return;
    setIsRefreshing(true);
    await onRefreshMerchants(location.lat, location.lng,
      categoryFilter !== "All" ? categoryFilter : null);
    setIsRefreshing(false);
  }

  return (
    <div className="flex flex-col h-full min-h-[500px] w-full relative bg-slate-100">

      {/* ── Location status banner ── */}
      {locationStatus === "denied" && (
        <div className="absolute top-0 inset-x-0 z-[500] bg-amber-500 text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
          <AlertCircle size={14} />
          Location access denied — showing default KL Sentral area. Enable GPS for real results.
        </div>
      )}
      {locationStatus === "pending" && (
        <div className="absolute top-0 inset-x-0 z-[500] bg-blue-500 text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
          <Navigation size={14} className="animate-pulse" />
          Acquiring GPS location…
        </div>
      )}

      {/* ── Category filter pills ── */}
      <div className={`absolute left-4 right-16 z-[400] flex gap-2 overflow-x-auto pb-1 ${locationStatus !== "granted" ? "top-10" : "top-4"}`}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setSelectedMerchant(null); }}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-full shadow-md whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? "bg-slate-900 text-white scale-105"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Refresh + Debug buttons ── */}
      <div className={`absolute right-3 z-[400] flex flex-col gap-2 ${locationStatus !== "granted" ? "top-14" : "top-4"}`}>
        <button
          onClick={handleRefresh}
          title="Refresh nearby merchants"
          className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-gx-600 hover:bg-emerald-50 transition"
        >
          <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={() => setShowDebug(d => !d)}
          title="Debug GPS"
          className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition text-xs font-black ${
            showDebug ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-100"
          }`}
        >
          D
        </button>
      </div>

      {/* ── Leaflet Map ── */}
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={true}
        className="flex-1 w-full z-0"
        style={{ minHeight: 400 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapFlyTo center={center} zoom={15} />

        {/* "You are here" marker + 3km radius circle */}
        {location && (
          <>
            <Marker position={[location.lat, location.lng]} icon={userIcon}>
              <Popup>
                <div className="text-xs font-bold">📍 You are here<br />
                  <span className="font-normal text-slate-500">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}<br />
                    Accuracy: ±{location.accuracy ? Math.round(location.accuracy) : "?"}m
                  </span>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[location.lat, location.lng]}
              radius={3000}
              pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.04, weight: 1.5, dashArray: "6 4" }}
            />
          </>
        )}

        {/* Merchant pins */}
        {filteredRecs.map((rec) => (
          <Marker
            key={rec.id}
            position={[rec.lat, rec.lng]}
            icon={createCustomIcon(rec.color)}
            eventHandlers={{ click: () => setSelectedMerchant(rec) }}
          />
        ))}
      </MapContainer>

      {/* ── Result count badge ── */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-md border border-slate-100">
        {filteredRecs.length} {filteredRecs.length === 1 ? "place" : "places"} found
        {location && " · within 3km"}
      </div>

      {/* ── Debug panel ── */}
      {showDebug && (
        <div className="absolute bottom-14 left-4 z-[400] bg-slate-900/95 text-green-400 font-mono text-[10px] p-3 rounded-xl shadow-xl max-w-xs border border-slate-700">
          <p className="font-bold text-white mb-1">GPS Debug</p>
          <p>Status: <span className={locationStatus === "granted" ? "text-green-400" : "text-yellow-400"}>{locationStatus}</span></p>
          <p>User lat: {location?.lat?.toFixed(6) ?? "—"}</p>
          <p>User lng: {location?.lng?.toFixed(6) ?? "—"}</p>
          <p>Accuracy: ±{location?.accuracy ? Math.round(location.accuracy) : "—"}m</p>
          <p>Results: {filteredRecs.length} (filter: {categoryFilter})</p>
          {selectedMerchant && (
            <>
              <p className="mt-1 border-t border-slate-600 pt-1 font-bold text-white">Selected:</p>
              <p>Merchant lat: {selectedMerchant.lat}</p>
              <p>Merchant lng: {selectedMerchant.lng}</p>
              <p>Distance: {selectedMerchant.distance_km}km</p>
              <p>Confidence: {selectedMerchant.confidence}</p>
            </>
          )}
        </div>
      )}

      {/* ── Merchant detail card ── */}
      {selectedMerchant && (
        <div className="absolute bottom-4 right-4 z-[400] w-80 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 animate-in slide-in-from-right-4 fade-in duration-200">
          <button
            onClick={() => setSelectedMerchant(null)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gx-600 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
              {selectedMerchant.category}
            </span>
            {selectedMerchant.sub_category && selectedMerchant.sub_category !== selectedMerchant.category && (
              <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
                {selectedMerchant.sub_category}
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
              <MapPin size={10} /> {selectedMerchant.distance_km}km away
            </span>
            {selectedMerchant.tags?.map(tag => (
              <span key={tag} className="text-[9px] font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-base font-black text-slate-900 mt-2 pr-6 leading-tight">{selectedMerchant.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{selectedMerchant.perk}</p>

          <div className={`mt-3 p-3 rounded-xl flex gap-3 ${
            selectedMerchant.color === "green" ? "bg-emerald-50 border border-emerald-100 text-emerald-900"
            : selectedMerchant.color === "yellow" ? "bg-amber-50 border border-amber-100 text-amber-900"
            : "bg-red-50 border border-red-100 text-red-900"
          }`}>
            <Info size={15} className="mt-0.5 flex-shrink-0 opacity-70" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider opacity-60">AI Recommendation</p>
              <p className="text-xs font-semibold mt-0.5 leading-relaxed">{selectedMerchant.reason}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-slate-400">Est. Price</p>
              <p className="text-sm font-black text-slate-700">RM{selectedMerchant.avg_spend}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-slate-400">You Save</p>
              <p className={`text-sm font-black ${selectedMerchant.estimated_savings > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                {selectedMerchant.estimated_savings > 0 ? "+" : ""}RM{selectedMerchant.estimated_savings}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-slate-400">AI Score</p>
              <p className="text-sm font-black text-gx-600">{Math.round((selectedMerchant.confidence ?? 0.7) * 100)}%</p>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 mt-2 text-right font-mono">
            #{filteredRecs.findIndex(r => r.id === selectedMerchant.id) + 1} of {filteredRecs.length}
          </p>
        </div>
      )}
    </div>
  );
}
