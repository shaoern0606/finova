import { Bot, Gauge, Sparkles, Scan } from "lucide-react";

const items = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "simulation", label: "Simulation", icon: Sparkles },
  { id: "scanner", label: "Scanner", icon: Scan }
];

export default function Nav({ active, onChange }) {
  return (
    <nav className="shrink-0 z-30 border-t border-slate-200 bg-white px-2 pb-3.5 pt-1.5">
      <div className="grid w-full grid-cols-3 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 transition-all duration-300 ${selected
                ? "text-gx-600 scale-110"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${selected ? "bg-gx-50" : ""}`}>
                <Icon size={20} strokeWidth={selected ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${selected ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
              {selected && (
                <div className="h-1 w-1 rounded-full bg-gx-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

