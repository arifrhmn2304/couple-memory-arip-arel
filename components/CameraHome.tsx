// components/CameraHome.tsx
"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Image as ImageIcon, Sparkles, MapPin, Navigation, Lock, Map, Camera, FlipHorizontal } from "lucide-react";
import { MemoryItem } from "./AddMemoryModal";
// @ts-ignore
import heic2any from "heic2any";

const InteractivePickerMap = dynamic(() => import("./InteractivePickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-slate-950 rounded-2xl flex items-center justify-center text-xs text-sky-400 font-medium animate-pulse border border-sky-500/20">
      Memuat Peta Interaktif... 🗺️
    </div>
  ),
});

interface CameraHomeProps {
  memories: MemoryItem[];
  onAddMemory: (memory: MemoryItem) => void;
  onNavigateTab: (tab: string) => void;
  onShowToast: (msg: string) => void;
}

export default function CameraHome({ memories, onAddMemory, onNavigateTab, onShowToast }: CameraHomeProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [caption, setCaption] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [isGettingGPS, setIsGettingGPS] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const processImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileToProcess = file;

    // Konversi file HEIC dari iPhone
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      onShowToast("🔄 Mengonversi foto resolusi tinggi...");
      try {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 1.0,
        });
        
        const conversionResult = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        fileToProcess = new File([conversionResult], file.name.replace(/\.[^/.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        console.error("Gagal konversi HEIC:", err);
        onShowToast("⚠️ Gagal memproses foto.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      onShowToast("✅ Foto berhasil disiapkan!");
    };
    reader.readAsDataURL(fileToProcess);
  };

  // Fungsi untuk membalik posisi gambar secara horizontal (Mirror Flip)
  const handleFlipImage = () => {
    if (!capturedImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg", 1.0));
        onShowToast("🔄 Posisi foto dibalik!");
      }
    };
    img.src = capturedImage;
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      onShowToast("⚠️ Browser/HP kamu tidak mendukung fitur GPS.");
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
        onShowToast(`🎯 GPS HP berhasil mengunci lokasi (${lat.toFixed(4)}, ${lng.toFixed(4)})!`);
      },
      () => {
        setIsGettingGPS(false);
        onShowToast("⚠ Gagal mengambil lokasi GPS. Pastikan izin GPS di HP sudah aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectCoordsFromMap = (selectedLat: number, selectedLng: number, placeName?: string) => {
    setCoords({ lat: selectedLat, lng: selectedLng });
    if (placeName) setLocationName(placeName);
    setShowMapPicker(false);
    onShowToast(`📌 Pin lokasi (${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}) terkunci!`);
  };

  const handleSaveCapturedMemory = () => {
    if (!capturedImage || !caption.trim()) {
      onShowToast("⚠️ Harap tulis caption momen terlebih dahulu!");
      return;
    }
    setIsSaving(true);

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
      imageUrl: capturedImage,
      caption: caption,
      lat: coords?.lat,
      lng: coords?.lng,
    };

    onAddMemory(newMemory);
    onShowToast("✨ Momen berhasil dibagikan!");
    
    setCapturedImage(null);
    setCaption("");
    setLocationName("");
    setCoords(null);
    setShowMapPicker(false);
    setIsSaving(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 pb-20 flex flex-col items-center justify-between min-h-[80vh]">
      
      {/* INPUT TERSEMBUNYI UNTUK NATIVE CAMERA & GALERI */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={captureInputRef} 
        onChange={processImageFile} 
        className="hidden" 
      />
      
      <input 
        type="file" 
        accept="image/*,.heic,.HEIC" 
        ref={fileInputRef} 
        onChange={processImageFile} 
        className="hidden" 
      />

      {/* JENDELA PREVIEW UTAMA */}
      <div 
        onClick={() => !capturedImage && captureInputRef.current?.click()}
        className={`relative w-full aspect-square max-h-[60vh] bg-black rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center my-auto ${!capturedImage ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
      >
        {!capturedImage ? (
          <div className="flex flex-col items-center justify-center space-y-4 opacity-60">
            <div className="w-20 h-20 rounded-full border-2 border-slate-600 flex items-center justify-center bg-slate-800/50">
              <Camera className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-400 tracking-wide">Ketuk untuk Buka Kamera Bawaan HP</p>
          </div>
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      {/* KONTROL BAWAH KAMERA (SIMETRIS: GALERI - JEPRET - RIWAYAT) */}
      {!capturedImage ? (
        <div className="w-full flex items-center justify-around pt-3 pb-2 px-2">
          {/* Tombol Galeri di Kiri */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center border border-white/10 shadow-lg text-white transition cursor-pointer"
            title="Pilih dari Galeri"
          >
            <ImageIcon className="w-5 h-5 text-sky-400" />
          </button>

          {/* Tombol Jepret Utama di Tengah */}
          <button
            onClick={() => captureInputRef.current?.click()}
            className="w-20 h-20 rounded-full border-4 border-sky-500 flex items-center justify-center p-1 shadow-2xl active:scale-95 transition cursor-pointer bg-black/20 shadow-sky-500/30"
          >
            <div className="w-full h-full bg-white rounded-full hover:bg-slate-200 transition flex items-center justify-center">
              <Camera className="w-7 h-7 text-slate-800" />
            </div>
          </button>

          {/* Tombol Riwayat dengan Thumbnail di Kanan */}
          <button
            onClick={() => onNavigateTab("calendar")}
            className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-sky-400/50 bg-slate-800 shadow-lg transition active:scale-95 cursor-pointer relative group"
            title="Lihat Riwayat"
          >
            <img 
              src={memories.length > 0 ? memories[0].imageUrl : "/foto-kita.jpg"}
              alt="Riwayat" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
            />
            <div className="absolute inset-0 bg-black/20" />
          </button>
        </div>
      ) : (
        <div className="w-full space-y-2.5 pt-2 pb-1 animate-in fade-in duration-200 bg-slate-900/90 backdrop-blur-xl p-3.5 rounded-3xl border border-sky-500/20 shadow-xl">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Cerita Momen</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis kenangan manis hari ini..."
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 shadow-inner"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-300">Nama Tempat / Lokasi</label>
              {coords && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Pin Terkunci
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Pantai Padang"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 bg-slate-950 text-white placeholder:text-slate-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingGPS}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm border cursor-pointer ${
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
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer border ${
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

            {showMapPicker && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-sky-500/30">
                <InteractivePickerMap onSelectCoords={handleSelectCoordsFromMap} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <button
              onClick={() => {
                setCapturedImage(null);
                setCoords(null);
                setShowMapPicker(false);
              }}
              className="py-2 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-bold hover:bg-slate-700 transition cursor-pointer"
            >
              Ulangi
            </button>

            {/* Tombol Putar/Balik Gambar (Mirror Flip) */}
            <button
              onClick={handleFlipImage}
              className="py-2 rounded-xl bg-sky-950/80 text-sky-300 border border-sky-500/30 text-[11px] font-bold hover:bg-sky-900 transition cursor-pointer flex items-center justify-center gap-1"
              title="Balik Posisi Foto"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Putar</span>
            </button>

            <button
              onClick={handleSaveCapturedMemory}
              disabled={isSaving}
              className="py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-bold shadow-lg shadow-sky-500/30 hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1 border border-sky-400/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
