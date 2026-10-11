// components/DashboardHeader.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Heart, Sparkles, Clock, Music, Volume2 } from "lucide-react";

export default function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Jam Digital Live
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Inisialisasi Audio Backsound dari Raw URL GitHub Repo Kamu
  useEffect(() => {
    audioRef.current = new Audio("https://raw.githubusercontent.com/arifrhmn2304/couple-memory-arip-arel/main/our-song.mp3");
    
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().catch(() => {
        console.log("Autoplay diblokir browser");
      });
      setIsPlayingMusic(true);
    }
  };

  // Perhitungan Detail: Tahun, Bulan, dan Hari dari Tanggal Jadian (17 Februari 2022)
  const relationshipDuration = useMemo(() => {
    const startDate = new Date("2022-02-17");
    const today = new Date();

    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    let days = today.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }, []);

  return (
    <header className="w-full pt-4 pb-3">
      <div className="w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-4 border border-sky-500/20 shadow-2xl shadow-sky-950/50 relative overflow-hidden flex items-center justify-between">
        
        {/* KONTEN UTAMA: COUNTER TAHUN, BULAN, HARI */}
        <div className="flex items-center gap-3 z-10">
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
            
            <div className="flex items-baseline gap-1 text-white">
              {relationshipDuration.years > 0 && (
                <span className="text-xs font-bold">
                  {relationshipDuration.years} <span className="text-[10px] text-sky-300 font-normal">Tahun</span>
                </span>
              )}
              {relationshipDuration.months > 0 && (
                <span className="text-xs font-bold">
                  {relationshipDuration.months} <span className="text-[10px] text-sky-300 font-normal">Bulan</span>
                </span>
              )}
              <span className="text-xs font-bold">
                {relationshipDuration.days} <span className="text-[10px] text-sky-300 font-normal">Hari ✨</span>
              </span>
            </div>
          </div>
        </div>

        {/* WIDGET KANAN: TOMBOL PEMUTAR MUSIK & JAM DIGITAL */}
        <div className="flex items-center gap-2 z-10">
          {/* Tombol Backsound Playlist */}
          <button
            onClick={toggleMusic}
            className={`p-2 rounded-2xl border transition shadow-sm flex items-center justify-center cursor-pointer ${
              isPlayingMusic 
                ? "bg-sky-500 text-white border-sky-400 shadow-sky-500/40 animate-pulse" 
                : "bg-sky-950/60 text-sky-400 border-sky-500/30 hover:bg-sky-900/60"
            }`}
            title={isPlayingMusic ? "Matikan Musik" : "Putar Backsound Romantis"}
          >
            {isPlayingMusic ? <Volume2 className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
          </button>

          {/* Jam Digital */}
          <div className="px-3 py-1.5 rounded-2xl bg-sky-950/60 border border-sky-500/30 text-sky-300 text-xs font-black tracking-wider shadow-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>{currentTime || "00:00"}</span>
          </div>
        </div>

        {/* Efek Cahaya Latar */}
        <div className="absolute right-[-20px] top-[-20px] w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>
    </header>
  );
}