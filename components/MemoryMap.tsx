// components/MemoryMap.tsx
"use client";

import dynamic from "next/dynamic";
import { MemoryItem } from "./AddMemoryModal";
import { MapPin, Sparkles } from "lucide-react";

const LeafletMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-slate-900/95 text-slate-400 text-xs rounded-[28px] border border-sky-500/30 gap-2">
      <span className="text-2xl animate-spin">🗺️</span>
      <span>Memuat Peta Kenangan...</span>
    </div>
  ),
});

interface MemoryMapProps {
  memories: MemoryItem[];
}

export default function MemoryMap({ memories }: MemoryMapProps) {
  return (
    <div className="w-full pb-32 space-y-4">
      {/* Header Info Peta (Ukuran disamakan dengan Header & To-Do List) */}
      <div className="w-full bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-4 border border-sky-500/25 shadow-2xl shadow-sky-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 flex items-center justify-center text-sm shadow-inner shrink-0">
            <MapPin className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">Peta Kenangan</h3>
            <p className="text-[10px] font-bold text-sky-400 mt-0.5">
              {memories.length} Pin Tempat Yang Sudah Kita Kunjungi
            </p>
          </div>
        </div>

        <span className="text-[9px] font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1.5 rounded-full border border-sky-500/30 flex items-center gap-1 shadow-inner">
          <Sparkles className="w-2.5 h-2.5 text-sky-400" />
          <span>Lokasi Kita</span>
        </span>
      </div>

      {/* Map Container */}
      <div className="w-full h-[400px] rounded-[28px] overflow-hidden border border-sky-500/25 shadow-2xl shadow-sky-950/90 relative z-10 bg-slate-900">
        <LeafletMap memories={memories} />
      </div>

      {/* Footer Info Tips */}
      <div className="p-3.5 bg-slate-900/95 backdrop-blur-2xl rounded-[24px] border border-sky-500/20 text-center shadow-lg">
        <p className="text-[10px] text-slate-300 font-medium">
          💡 Klik ikon Foto di peta untuk melihat foto & kenangan tempat tersebut!
        </p>
      </div>
    </div>
  );
}