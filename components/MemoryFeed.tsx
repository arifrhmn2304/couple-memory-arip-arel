// components/MemoryFeed.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { MapPin, Calendar, Maximize2, X, Download, Trash2, AlertTriangle } from "lucide-react";
import { MemoryItem } from "./AddMemoryModal";

interface MemoryFeedProps {
  memories?: MemoryItem[];
  onDeleteMemory?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function MemoryFeed({ memories = [], onDeleteMemory, onShowToast }: MemoryFeedProps) {
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (memories.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-dashed border-sky-500/30 text-center space-y-3 h-[65vh] flex flex-col items-center justify-center shadow-2xl">
          <span className="text-5xl animate-bounce">📸</span>
          <h4 className="text-sm font-bold text-white">Belum Ada Momen Tersimpan</h4>
          <p className="text-xs text-slate-400 max-w-[260px]">
            Gunakan kamera di bawah untuk mengabadikan kenangan kencan kalian!
          </p>
        </div>
      </div>
    );
  }

  const handleTouchStart = (id: string) => {
    pressTimer.current = setTimeout(() => {
      setDeleteId(id);
    }, 700); // Tahan selama kurang lebih 0.7 detik
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleConfirmDelete = (id: string) => {
    if (onDeleteMemory) {
      onDeleteMemory(id);
    }
    setDeleteId(null);
  };

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
      <div className="w-full max-w-sm mx-auto px-4 pb-32 space-y-6 overflow-y-auto no-scrollbar">
        {memories.map((item) => (
          <div
            key={item.id}
            onTouchStart={() => handleTouchStart(item.id)}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart(item.id)}
            onMouseUp={handleTouchEnd}
            className="w-full space-y-2 group select-none"
          >
            <div 
              onClick={() => {
                if (!deleteId) setActiveMemory(item);
              }}
              className="relative w-full aspect-square bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl shadow-sky-950/50 cursor-pointer border border-white/10 flex items-center justify-center"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 pointer-events-none"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />

              <img
                src={item.imageUrl}
                alt={item.caption}
                className="relative z-10 w-full h-full object-cover animate-live-photo transition-transform duration-700 hover:scale-105 pointer-events-none"
              />

              <div className="absolute bottom-3 right-3 z-20 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white/90 text-[10px] font-medium flex items-center gap-1.5 shadow-lg border border-white/10 pointer-events-none">
                <Maximize2 className="w-3 h-3 text-sky-400 animate-pulse" />
                <span>Ketuk Foto</span>
              </div>
            </div>

            <div className="px-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar className="w-2.5 h-2.5 text-slate-500" />
                  <span>{item.date}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                {item.caption}
              </p>
            </div>
          </div>
        ))}
        
        <div className="h-32 w-full shrink-0 pointer-events-none"></div>
      </div>

      {/* MODAL FULLSCREEN FOTO */}
      {isMounted && createPortal(
        <AnimatePresence>
          {activeMemory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 px-2 z-10">
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
                  className="relative w-full max-h-[80vh] rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black cursor-grab active:cursor-grabbing touch-none"
                >
                  <img
                    src={activeMemory.imageUrl}
                    alt={activeMemory.caption}
                    className="w-full h-auto max-h-[80vh] object-contain pointer-events-none"
                  />
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[85%] w-fit bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center shadow-lg">
                    <p className="text-xs text-white font-medium break-words">{activeMemory.caption}</p>
                  </div>
                </motion.div>
              </div>

              <div className="h-4 w-full" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* POP-UP KONFIRMASI HAPUS MOMEN (SAAT FOTO DITAHAN) */}
      {isMounted && createPortal(
        <AnimatePresence>
          {deleteId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-red-500/30 w-full max-w-xs rounded-3xl p-5 text-center space-y-4 shadow-2xl shadow-red-950/50"
              >
                <div className="w-12 h-12 bg-red-950/80 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Hapus Kenangan Ini?</h4>
                  <p className="text-[8px] text-slate-400">
                    Momen manis ini akan dihapus permanen dari daftar kenangan kalian.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(deleteId)}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-red-500/25 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}