import { Bot, Gauge, Sparkles, Scan, LineChart } from "lucide-react";

const items = [
  { id: "dashboard", label: "Insights", icon: Gauge },
  { id: "investments", label: "Wealth", icon: LineChart },
  { id: "simulation", label: "What If", icon: Sparkles },
  { id: "scanner", label: "Scan", icon: Scan }
];

export default function Nav({ active, onChange }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/90 px-3 pb-3.5 pt-2 shadow-[0_-14px_36px_rgba(76,29,149,0.12)] backdrop-blur-xl">
      <div className="grid w-full grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition-all duration-300 ${selected
                ? "bg-gx-50 text-gx-600"
                : "text-slate-400 hover:bg-violet-50 hover:text-gx-600"
                }`}
            >
              <div className="p-1 rounded-lg transition-colors">
                <Icon size={20} strokeWidth={selected ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${selected ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
              {selected && (
                <div className="h-1 w-5 rounded-full bg-gx-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

