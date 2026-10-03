// components/AddMemoryModal.tsx
"use client";

import { useState, ChangeEvent } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Sparkles, X, Camera, MapPin, Map, Navigation, Lock } from "lucide-react";

const InteractivePickerMap = dynamic(() => import("./InteractivePickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-slate-950 rounded-2xl flex items-center justify-center text-xs text-sky-400 font-medium animate-pulse border border-sky-500/20">
      Memuat Peta Interaktif... 🗺️
    </div>
  ),
});

export interface MemoryItem {
  id: string;
  author: string;
  avatar: string;
  date: string;
  location: string;
  imageUrl: string;
  caption: string;
  lat?: number;
  lng?: number;
}

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMemory: (newMemory: MemoryItem) => void;
  onShowToast?: (msg: string) => void;
}

export default function AddMemoryModal({
  isOpen,
  onClose,
  onAddMemory,
  onShowToast,
}: AddMemoryModalProps) {
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (onShowToast) onShowToast("⚠️ Browser/HP kamu tidak mendukung fitur GPS.");
      return;
    }

    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setIsGettingGPS(false);
        setShowMapPicker(false);
        if (onShowToast) {
          onShowToast(`🎯 GPS HP berhasil mengunci lokasi (${lat.toFixed(4)}, ${lng.toFixed(4)})!`);
        }
      },
      () => {
        setIsGettingGPS(false);
        if (onShowToast) {
          onShowToast("⚠️ Gagal mengambil lokasi GPS. Pastikan izin GPS di HP sudah aktif.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectCoordsFromMap = (selectedLat: number, selectedLng: number, placeName?: string) => {
    setCoords({ lat: selectedLat, lng: selectedLng });
    if (placeName) setLocationName(placeName);
    setShowMapPicker(false);
    if (onShowToast) {
      onShowToast(`📌 Pin lokasi (${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}) terkunci!`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview || !caption.trim()) {
      if (onShowToast) onShowToast("⚠️ Harap pilih foto dan isi cerita momen!");
      return;
    }

    const todayFormatted = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const newMemory: MemoryItem = {
      id: Date.now().toString(),
      author: "Memory Our",
      avatar: "⚡",
      date: todayFormatted,
      location: locationName.trim() || "Padang, Sumatera Barat",
      imageUrl: imagePreview,
      caption: caption,
      lat: coords?.lat,
      lng: coords?.lng,
    };

    onAddMemory(newMemory);

    setCaption("");
    setLocationName("");
    setCoords(null);
    setImagePreview(null);
    setShowMapPicker(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex justify-center items-end p-0">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-slate-900 border-t border-sky-500/30 text-white w-full max-w-sm rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-sky-950/80"
      >
        {/* iOS Drag Bar Handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-1 mb-1" />

        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <h3 className="font-bold text-white text-sm">Tambah Memory Kita</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-3.5" onSubmit={handleSubmit}>
          {/* Form Foto Upload */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">Foto Memory</label>
            <label className="relative border-2 border-dashed border-sky-500/30 rounded-2xl p-2 text-center hover:border-sky-400 transition cursor-pointer bg-slate-950 flex flex-col items-center justify-center min-h-[130px] max-h-[200px] overflow-hidden">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover rounded-xl" />
              ) : (
                <div className="py-3 flex flex-col items-center">
                  <Camera className="w-7 h-7 text-sky-400 mb-1" />
                  <p className="text-xs font-bold text-sky-400">Pilih foto dari HP</p>
                  <p className="text-[10px] text-slate-400">Format JPG, PNG, WEBP</p>
                </div>
              )}
            </label>
          </div>

          {/* Form Lokasi */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-200">Nama Tempat / Lokasi</label>
              {coords && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Pin Terkunci
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Famss Clothing"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 bg-slate-950 text-white placeholder:text-slate-400 shadow-inner"
                />
              </div>

              {/* 2 PILIHAN PENENTUAN LOKASI */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingGPS}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm border cursor-pointer ${
                    coords && !showMapPicker
                      ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                      : "bg-sky-950/80 hover:bg-sky-900 border-sky-500/40 text-sky-300"
                  }`}
                >
                  <Navigation className={`w-3.5 h-3.5 ${isGettingGPS ? "animate-spin" : ""}`} />
                  {isGettingGPS ? "GPS..." : "🎯 GPS HP"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer border ${
                    showMapPicker
                      ? "bg-sky-500 text-white border-sky-400 shadow-sky-500/30"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-sky-400" />
                  {showMapPicker ? "Tutup Peta" : "📍 Cari di Peta"}
                </button>
              </div>
            </div>

            {/* Peta Interaktif Manual */}
            {showMapPicker && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-sky-500/30">
                <InteractivePickerMap onSelectCoords={handleSelectCoordsFromMap} />
              </div>
            )}
          </div>

          {/* Form Cerita */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">Cerita Memory</label>
            <textarea
              rows={3}
              placeholder="Tulis kenangan manis hari ini..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 bg-slate-950 text-white placeholder:text-slate-400 shadow-inner"
            />
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-sky-500/25 transition active:scale-95 cursor-pointer border border-sky-400/40"
          >
            ⚡ Simpan Memory
          </button>
        </form>
      </motion.div>
    </div>
  );
}