import { Bot, Gauge, Sparkles, Scan } from "lucide-react";

const items = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "simulation", label: "Simulation", icon: Sparkles },
  { id: "scanner", label: "Scanner", icon: Scan }
];

export default function Nav({ active, onChange }) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-emerald-100 bg-white/95 px-3 py-2 backdrop-blur md:static md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gx-500 font-black text-white">F</div>
          <div>
            <p className="text-sm font-black text-gx-900">FINMATE OS</p>
            <p className="text-xs text-slate-500">FinScope Edition</p>
          </div>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 md:w-auto md:flex">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${selected ? "bg-gx-500 text-white" : "bg-emerald-50 text-gx-900 hover:bg-emerald-100"
                  }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

