// components/CalendarTimeline.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Download } from "lucide-react";
import { MemoryItem } from "./AddMemoryModal";

interface CalendarTimelineProps {
  memories?: MemoryItem[];
  onShowToast?: (msg: string) => void;
}

interface MonthData {
  title: string;
  year: number;
  monthIndex: number;
  monthKeywords: string[];
  daysInMonth: number;
  startDayOffset: number;
}

export default function CalendarTimeline({ memories = [], onShowToast }: CalendarTimelineProps) {
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const currentMonthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      if (currentMonthRef.current) {
        currentMonthRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const timelineMonths = useMemo(() => {
    const monthsList: MonthData[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const monthNames = [
      { name: "januari", keywords: ["jan", "januari"] },
      { name: "februari", keywords: ["feb", "februari"] },
      { name: "maret", keywords: ["mar", "maret"] },
      { name: "april", keywords: ["apr", "april"] },
      { name: "mei", keywords: ["mei", "may"] },
      { name: "juni", keywords: ["jun", "juni"] },
      { name: "juli", keywords: ["jul", "juli"] },
      { name: "agustus", keywords: ["agu", "aug", "agustus"] },
      { name: "september", keywords: ["sep", "september"] },
      { name: "oktober", keywords: ["okt", "oct", "oktober"] },
      { name: "november", keywords: ["nov", "november"] },
      { name: "desember", keywords: ["des", "dec", "desember"] },
    ];

    // MENTOK DI BULAN BERJALAN SAJA (TIDAK ADA BULAN KOSONG DI BAWAHNYA)
    for (let m = 0; m <= currentMonth; m++) {
      const targetDate = new Date(currentYear, m, 1);
      const year = targetDate.getFullYear();
      const monthIdx = targetDate.getMonth();
      
      const title = `${targetDate.toLocaleString("id-ID", { month: "long" })} ${year}`;
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
      const startDayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

      monthsList.push({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        year,
        monthIndex: monthIdx,
        monthKeywords: monthNames[monthIdx].keywords,
        daysInMonth,
        startDayOffset,
      });
    }

    return monthsList;
  }, []);

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `memory-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onShowToast) onShowToast("📥 Foto berhasil disimpan ke galeri!");
    } catch {
      if (onShowToast) onShowToast("⚠️ Gagal mengunduh foto.");
    }
  };

  const handleNextPhoto = () => {
    if (!activeMemory || memories.length <= 1) return;
    const currentIndex = memories.findIndex((m) => m.id === activeMemory.id);
    const nextIndex = (currentIndex + 1) % memories.length;
    setActiveMemory(memories[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!activeMemory || memories.length <= 1) return;
    const currentIndex = memories.findIndex((m) => m.id === activeMemory.id);
    const prevIndex = (currentIndex - 1 + memories.length) % memories.length;
    setActiveMemory(memories[prevIndex]);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120) {
      setActiveMemory(null);
    } else if (info.offset.x < -70) {
      handleNextPhoto();
    } else if (info.offset.x > 70) {
      handlePrevPhoto();
    }
  };

  return (
    <>
      <div className="w-full pb-32 space-y-6 overflow-y-auto no-scrollbar">
        {timelineMonths.map((monthData, monthIndex) => {
          const days = Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1);
          
          const currentDate = new Date();
          const isCurrentMonth = monthData.monthIndex === currentDate.getMonth() && monthData.year === currentDate.getFullYear();
          const currentDayNum = currentDate.getDate();

          return (
          <div key={monthIndex} className="w-full space-y-4">
            {/* Kotak Kartu Bulan */}
            <div 
              ref={isCurrentMonth ? currentMonthRef : null}
              className="bg-slate-900/95 backdrop-blur-xl rounded-[32px] p-5 shadow-2xl border border-sky-500/20 relative z-10 w-full overflow-hidden"
            >
              <div className="mb-5 bg-slate-950/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-between">
                <h3 className="text-white font-bold text-sm tracking-wide">
                  {monthData.title}
                </h3>
              </div>
              
              <div className="grid grid-cols-7 gap-3 place-items-center">
                {Array.from({ length: monthData.startDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-11 h-11" />
                ))}

                {days.map((day) => {
                  const memoryForThisDay = memories.find((mem) => {
                    if (!mem.date) return false;
                    const dateStr = mem.date.toLowerCase();
                    const dateParts = dateStr.split(/\s+/);
                    const exactDayMatch = dateParts.includes(day.toString());
                    const hasMonthKeyword = monthData.monthKeywords.some((keyword) => dateStr.includes(keyword));
                    const hasYear = dateStr.includes(monthData.year.toString());

                    return exactDayMatch && hasMonthKeyword && hasYear;
                  });

                  const hasMemory = !!memoryForThisDay;
                  const isPastDayInCurrentMonth = isCurrentMonth && day < currentDayNum;
                  const isPastMonth = monthData.year < currentDate.getFullYear() || (monthData.year === currentDate.getFullYear() && monthData.monthIndex < currentDate.getMonth());

                  return (
                    <div key={day} className="flex items-center justify-center w-full aspect-square">
                      {hasMemory && memoryForThisDay ? (
                        <div 
                          onClick={() => setActiveMemory(memoryForThisDay)}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-sky-400 shadow-lg shadow-sky-500/40 cursor-pointer hover:scale-105 transition-transform z-20 bg-slate-950 shrink-0"
                        >
                          <img src={memoryForThisDay.imageUrl} alt="Memory" className="w-full h-full object-cover" />
                        </div>
                      ) : isPastMonth || isPastDayInCurrentMonth ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-slate-700/80 border border-slate-600/50 shadow-inner" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GARIS ROLLER COASTER DENGAN PUTARAN LINGKARAN 360° ANTAR BULAN */}
            {monthIndex < timelineMonths.length - 1 && (
              <div className="w-full flex justify-center py-0 relative h-10">
                {monthIndex % 3 === 0 ? (
                  /* Roller Coaster Loop 360° ke Kanan */
                  <svg className="w-15 h-15 text-sky-600/80 overflow-visible" viewBox="0 0 80 100" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4">
                    <path d="M40 0 C40 15, 65 15, 65 35 C65 55, 15 55, 15 35 C15 15, 40 25, 40 80" strokeLinecap="round" />
                  </svg>
                ) : monthIndex % 3 === 1 ? (
                  /* Roller Coaster Loop 360° ke Kiri */
                  <svg className="w-15 h-15 text-sky-600/80 overflow-visible" viewBox="0 0 80 100" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4">
                    <path d="M40 0 C40 15, 15 15, 15 35 C15 55, 65 55, 65 35 C65 15, 40 25, 40 80" strokeLinecap="round" />
                  </svg>
                ) : (
                  /* Roller Coaster Double Loop / S-Curve Meliuk Dinamis */
                  <svg className="w-15 h-15 text-sky-600/80 overflow-visible" viewBox="0 0 80 100" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 3">
                    <path d="M40 0 C 70 20, 10 40, 40 40 C 70 40, 10 60, 40 80" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            )}
          </div>
          );
        })}
        
        <div className="w-full shrink-0 pointer-events-none"></div>
      </div>

      {isMounted && createPortal(
        <AnimatePresence>
          {activeMemory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between w-full max-w-md mx-auto pt-4 px-2 z-10">
                <button
                  onClick={() => setActiveMemory(null)}
                  className="text-white bg-slate-800/80 hover:bg-slate-700 p-3 rounded-full transition shadow-xl border border-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <p className="text-[11px] text-slate-400 font-semibold">{activeMemory.date.split(" ").pop()}</p>
                  <h4 className="text-sm font-bold text-white tracking-wide">{activeMemory.date}</h4>
                </div>

                <button
                  onClick={() => handleDownload(activeMemory.imageUrl)}
                  className="text-white bg-slate-800/80 hover:bg-slate-700 p-3 rounded-full transition shadow-xl border border-slate-700 cursor-pointer"
                  title="Simpan ke Galeri"
                >
                  <Download className="w-5 h-5 text-sky-400" />
                </button>
              </div>

              <div className="relative flex-1 flex items-center justify-center p-2 max-w-lg mx-auto w-full">
                <motion.div
                  key={activeMemory.id}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={handleDragEnd}
                  className="relative w-full max-h-[65vh] aspect-square rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black cursor-grab active:cursor-grabbing touch-none"
                >
                  <img
                    src={activeMemory.imageUrl}
                    alt={activeMemory.caption}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[85%] w-fit bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center shadow-lg">
                    <p className="text-xs text-white font-medium">{activeMemory.caption}</p>
                  </div>
                </motion.div>
              </div>

              <div className="w-full max-w-md mx-auto pb-6 pt-2">
                <p className="text-[10px] text-slate-400 text-center mb-2 font-semibold">Geser atau pilih foto lainnya</p>
                <div className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar px-2">
                  {memories.map((mem) => {
                    const isSelected = mem.id === activeMemory.id;
                    return (
                      <div
                        key={mem.id}
                        onClick={() => setActiveMemory(mem)}
                        className={`w-14 h-14 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 shrink-0 border-2 ${
                          isSelected 
                            ? "border-sky-400 scale-110 shadow-lg shadow-sky-500/50" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={mem.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}