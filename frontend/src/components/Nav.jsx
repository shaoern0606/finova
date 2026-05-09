import { Gauge, LineChart, Scan, Sparkles, UserCircle } from "lucide-react";

// Items split 2 | SCAN | 2
const LEFT = [
  { id: "dashboard", label: "Insights", icon: Gauge },
  { id: "investments", label: "Wealth", icon: LineChart },
];
const RIGHT = [
  { id: "simulation", label: "Future Lab", icon: Sparkles },
  { id: "profile", label: "Profile", icon: UserCircle },
];

function NavItem({ item, active, onChange }) {
  const Icon = item.icon;
  const selected = active === item.id;
  return (
    <button
      key={item.id}
      onClick={() => onChange(item.id)}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all duration-200 ${selected
        ? "text-gx-600"
        : "text-slate-400 hover:text-gx-500"
        }`}
    >
      <Icon size={20} strokeWidth={selected ? 2.5 : 1.8} />
      <span className={`text-[9px] font-black uppercase tracking-wider ${selected ? "opacity-100" : "opacity-50"}`}>
        {item.label}
      </span>
      {/* Active dot indicator */}
      <span className={`h-1 w-4 rounded-full transition-all duration-300 ${selected ? "bg-gx-500 opacity-100" : "opacity-0"}`} />
    </button>
  );
}

export default function Nav({ active, onChange }) {
  const scanActive = active === "scanner";

  return (
    /* Outer wrapper — provides the notch space for the floating button */
    <nav className="absolute inset-x-0 bottom-0 z-40">
      {/* ── Floating Scan Button ─────────────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[26px] z-50">
        <button
          onClick={() => onChange("scanner")}
          aria-label="Scan receipt"
          className={`
            group relative flex h-[62px] w-[62px] items-center justify-center rounded-full
            shadow-[0_8px_30px_rgba(109,40,217,0.45)]
            transition-all duration-300 active:scale-95
            ${scanActive
              ? "bg-gradient-to-br from-gx-500 to-gx-700 scale-105"
              : "bg-gradient-to-br from-gx-400 to-gx-600 hover:scale-110 hover:shadow-[0_12px_40px_rgba(109,40,217,0.55)]"
            }
          `}
        >
          {/* Glow ring */}
          <span
            className={`absolute inset-0 rounded-full transition-all duration-500 ${scanActive
              ? "ring-4 ring-gx-300/40 ring-offset-2 ring-offset-transparent"
              : "group-hover:ring-4 group-hover:ring-gx-300/30 group-hover:ring-offset-2"
              }`}
          />

          {/* Pulse animation when active */}
          {scanActive && (
            <span className="absolute inset-0 rounded-full bg-gx-400/30 animate-ping" />
          )}

          <Scan
            size={26}
            strokeWidth={2}
            className={`text-white transition-transform duration-300 ${scanActive ? "scale-110" : "group-hover:scale-110"
              }`}
          />
        </button>

        {/* Label below scan button */}
        <p className={`text-center text-[9px] font-black uppercase tracking-widest mt-1.5 transition-colors ${scanActive ? "text-gx-600" : "text-slate-400"
          }`}>
          Scan
        </p>
      </div>

      {/* ── Bar background ──────────────────────────────────────── */}
      <div className="border-t border-violet-100 bg-white/95 px-2 pb-4 pt-2 shadow-[0_-12px_32px_rgba(76,29,149,0.1)] backdrop-blur-xl">
        {/* Center cut-out spacer so scan button floats naturally */}
        <div className="flex items-end w-full">
          {/* Left group */}
          <div className="flex flex-1">
            {LEFT.map((item) => (
              <NavItem key={item.id} item={item} active={active} onChange={onChange} />
            ))}
          </div>

          {/* Center spacer — exactly the width of the scan button */}
          <div className="w-[78px] shrink-0" />

          {/* Right group */}
          <div className="flex flex-1">
            {RIGHT.map((item) => (
              <NavItem key={item.id} item={item} active={active} onChange={onChange} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
