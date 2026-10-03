// components/DashboardHeader.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Heart, Sparkles, Clock } from "lucide-react";

export default function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState<string>("");

  // Update jam setiap detik
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateClock(); // Set langsung saat mount
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  const daysTogether = useMemo(() => {
    const startDate = new Date("2022-02-17");
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  }, []);

  return (
    <header className="w-full max-w-sm mx-auto px-4 pt-10 pb-3">
      <div className="w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-4 border border-sky-500/20 shadow-2xl shadow-sky-950/50 relative overflow-hidden flex items-center justify-between">
        
        {/* Sisi Kiri: Info Hari Bersama */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 flex items-center justify-center shadow-inner shrink-0">
            <Heart className="w-5 h-5 fill-sky-400 text-sky-400 animate-pulse" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Our Memories
              </span>
              <Sparkles className="w-3 h-3 text-sky-400" />
            </div>
            
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">
                {daysTogether}
              </span>
              <span className="text-[11px] font-medium text-sky-300/90">
                Days Togheter ✨
              </span>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Jam Digital Real-Time */}
        <div className="z-10 px-3 py-1.5 rounded-2xl bg-sky-950/60 border border-sky-500/30 text-sky-300 text-xs font-black tracking-wider shadow-sm flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>{currentTime || "00:00"}</span>
        </div>

        {/* Efek Cahaya Ambient Background Halus */}
        <div className="absolute right-[-20px] top-[-20px] w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>
    </header>
  );
}