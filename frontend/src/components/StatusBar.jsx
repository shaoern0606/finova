import { BatteryMedium, Signal, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export default function StatusBar({ variant = "dark" }) {
  const [time, setTime] = useState(new Date());

  const isLight = variant === "light";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className={`absolute top-0 left-0 w-full flex h-11 items-center justify-between px-7 z-[100] pointer-events-none transition-all duration-500 border-b border-white/5 ${isLight ? "bg-white/50 backdrop-blur-md" : "bg-white/50 backdrop-blur-md"}`}>
      {/* Time */}
      <div className="flex-1">
        <span className={`text-[13px] font-black tracking-tight ${isLight ? "text-black" : "text-gx-900"}`}>
          {formatTime(time)}
        </span>
      </div>

      {/* Dynamic Notch */}
      <div className={`h-[22px] w-[90px] rounded-full flex items-center justify-center transition-colors duration-500 ${isLight ? "bg-gx-900 shadow-md" : "bg-gx-900 shadow-md"}`}>
        <div className={`h-1.5 w-8 rounded-full ${isLight ? "bg-white/20" : "bg-white/20"}`}></div>
      </div>

      {/* Icons */}
      <div className={`flex flex-1 items-center justify-end gap-2 ${isLight ? "text-black" : "text-gx-900"}`}>
        <Signal size={14} strokeWidth={2.5} />
        <Wifi size={14} strokeWidth={2.5} />
        <BatteryMedium size={16} strokeWidth={2.5} />
      </div>
    </div>
  );
}
