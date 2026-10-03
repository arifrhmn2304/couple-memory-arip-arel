// components/CameraHome.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Zap, RefreshCw, Image as ImageIcon, ChevronDown, Sparkles, MapPin, Navigation, Lock, Map } from "lucide-react";
import { MemoryItem } from "./AddMemoryModal";
// @ts-ignore
import heic2any from "heic2any";

const InteractivePickerMap = dynamic(() => import("./InteractivePickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-40 bg-slate-950 rounded-2xl flex items-center justify-center text-xs text-sky-400 font-medium animate-pulse border border-sky-500/20">
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(3); // Batas maksimal zoom dari hardware HP
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [caption, setCaption] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [isGettingGPS, setIsGettingGPS] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fungsi untuk mengontrol Flash / Torch fisik HP
  const togglePhysicalFlash = async (turnOn: boolean) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (capabilities && capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: turnOn } as any]
          });
        }
      }
    } catch (err) {
      console.error("Gagal menyalakan flash fisik:", err);
    }
  };

  // Fungsi untuk mengatur Hardware Zoom Kamera HP
  const applyHardwareZoom = async (newZoom: number) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (capabilities && capabilities.zoom) {
          // Jika HP mendukung hardware zoom bawaan
          await track.applyConstraints({
            advanced: [{ zoom: newZoom } as any]
          });
          setZoomLevel(newZoom);
        } else {
          // Fallback jika hardware tidak mendukung zoom web API
          setZoomLevel(newZoom);
          onShowToast("⚠️ Hardware HP tidak mendukung zoom langsung, menggunakan penyesuaian layar.");
        }
      }
    } catch (err) {
      console.error("Gagal mengubah zoom hardware:", err);
    }
  };

  // Inisialisasi Kamera Fisik & Deteksi Kapasitas Zoom HP
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach((track) => track.stop());
        }

        // Meminta izin video dengan opsi PTZ/Zoom jika didukung browser
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            zoom: true,
          } as any,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }

        // Cek batasan zoom maksimal dari kamera HP tersebut
        const track = activeStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (capabilities && capabilities.zoom) {
          setMaxZoom(capabilities.zoom.max || 5);
        }
      } catch (err) {
        console.error("Gagal mengakses kamera dengan zoom, mencoba mode standar:", err);
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
          }
        } catch (fallbackErr) {
          onShowToast("⚠️ Tidak dapat mengakses kamera perangkat.");
        }
      }
    }

    if (!capturedImage) {
      initCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [facingMode, capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageUrl);
      
      if (isFlashOn) {
        togglePhysicalFlash(false);
        setIsFlashOn(false);
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileToProcess = file;

    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      onShowToast("🔄 Mengonversi foto iPhone (.heic)...");
      try {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });
        
        const conversionResult = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        fileToProcess = new File([conversionResult], file.name.replace(/\.[^/.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        console.error("Gagal konversi HEIC:", err);
        onShowToast("⚠️ Gagal memproses foto iPhone.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(fileToProcess);
  };

  const handleSwitchCamera = () => {
    if (isFlashOn) {
      togglePhysicalFlash(false);
      setIsFlashOn(false);
    }
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setZoomLevel(1);
    onShowToast(facingMode === "user" ? "🔄 Beralih ke Kamera Belakang" : "🔄 Beralih ke Kamera Depan");
  };

  // Logika Tombol Zoom Bergantian (1x -> 2x -> maxZoom -> kembali ke 1x)
  const handleToggleZoom = async () => {
    let nextZoom = zoomLevel + 1;
    if (nextZoom > Math.min(maxZoom, 4)) {
      nextZoom = 1;
    }
    await applyHardwareZoom(nextZoom);
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
        onShowToast("⚠️ Gagal mengambil lokasi GPS. Pastikan izin GPS di HP sudah aktif.");
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
    <div className="w-full max-w-sm mx-auto px-4 pb-36 flex flex-col items-center justify-between min-h-[75vh]">
      
      {/* JENDELA KAMERA UTAMA DI TENGAH */}
      <div className="relative w-full aspect-square bg-black rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: `${facingMode === "user" ? "scaleX(-1)" : "scaleX(1)"}` }}
          />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}

        {isFlashOn && <div className="absolute inset-0 bg-white/40 pointer-events-none animate-pulse" />}

        {!capturedImage && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <button
              onClick={async () => {
                const nextState = !isFlashOn;
                setIsFlashOn(nextState);
                await togglePhysicalFlash(nextState);
              }}
              className={`p-3 rounded-full backdrop-blur-md transition shadow-lg border cursor-pointer ${
                isFlashOn 
                  ? "bg-sky-500 text-white border-sky-400 shadow-sky-500/50" 
                  : "bg-black/40 text-white border-white/10"
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleToggleZoom}
              className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold border border-white/10 shadow-lg flex items-center gap-1 cursor-pointer"
            >
              {zoomLevel}x
            </button>
          </div>
        )}
      </div>

      {/* KONTROL BAWAH KAMERA */}
      {!capturedImage ? (
        <div className="w-full flex items-center justify-around pt-6 px-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleGalleryUpload} 
            accept="image/*,.heic,.HEIC" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center border border-white/10 shadow-lg text-white transition cursor-pointer"
            title="Pilih dari Galeri"
          >
            <ImageIcon className="w-5 h-5 text-sky-400" />
          </button>

          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-sky-500 flex items-center justify-center p-1.5 shadow-2xl active:scale-95 transition cursor-pointer bg-black/20 shadow-sky-500/30"
          >
            <div className="w-full h-full bg-white rounded-full hover:bg-slate-200 transition" />
          </button>

          <button
            onClick={handleSwitchCamera}
            className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center border border-white/10 shadow-lg text-white transition cursor-pointer"
            title="Putar Kamera"
          >
            <RefreshCw className="w-5 h-5 text-sky-400" />
          </button>
        </div>
      ) : (
        <div className="w-full space-y-3.5 pt-4 animate-in fade-in duration-200 bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-sky-500/20 shadow-xl">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Cerita Momen</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis kenangan manis hari ini..."
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 shadow-inner"
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

            <div className="space-y-2">
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Pantai Padang"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 bg-slate-950 text-white placeholder:text-slate-500 shadow-inner"
                />
              </div>

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

            {showMapPicker && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-sky-500/30">
                <InteractivePickerMap onSelectCoords={handleSelectCoordsFromMap} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setCapturedImage(null);
                setCoords(null);
                setShowMapPicker(false);
              }}
              className="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
            >
              Ulangi / Ganti Foto
            </button>
            <button
              onClick={handleSaveCapturedMemory}
              disabled={isSaving}
              className="py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-sky-500/30 hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5 border border-sky-400/40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simpan Momen</span>
            </button>
          </div>
        </div>
      )}

      {/* TOMBOL RIWAYAT DENGAN FOTO TERAKHIR */}
      <div className="pt-4 pb-2">
        <button
          onClick={() => onNavigateTab("calendar")}
          className="flex items-center gap-2 bg-[#1c1c1e]/90 hover:bg-[#2c2c2e] px-5 py-2.5 rounded-full border border-white/10 shadow-xl transition cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-sky-400/50 bg-slate-800">
            <img 
              src={memories.length > 0 ? memories[0].imageUrl : "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100"} 
              alt="Riwayat" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Riwayat</span>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
}