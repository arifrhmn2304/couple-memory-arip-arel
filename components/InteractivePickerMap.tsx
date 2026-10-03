// components/InteractivePickerMap.tsx
"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customPinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface InteractivePickerMapProps {
  onSelectCoords: (lat: number, lng: number, placeName?: string) => void;
}

function MapClickListener({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function InteractivePickerMap({ onSelectCoords }: InteractivePickerMapProps) {
  const defaultPadang = { lat: -0.9471, lng: 100.4172 };

  const [placeNameInput, setPlaceNameInput] = useState("");
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number }>(defaultPadang);
  const [isPinned, setIsPinned] = useState(false);

  const handleMapClick = (lat: number, lng: number) => {
    setPinnedCoords({ lat, lng });
    setIsPinned(true);
  };

  const handleLockLocation = () => {
    onSelectCoords(pinnedCoords.lat, pinnedCoords.lng, placeNameInput.trim());
  };

  return (
    <div className="space-y-2">
      {/* Input Nama Tempat / Jalan - FIX Kontras Teks Gelap */}
      <div>
        <input
          type="text"
          placeholder="🔍 Ketik nama jalan/tempat"
          value={placeNameInput}
          onChange={(e) => setPlaceNameInput(e.target.value)}
          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400 bg-slate-950 text-white placeholder:text-slate-400 shadow-inner"
        />
      </div>

      <p className="text-[10px] text-sky-300 font-semibold text-center bg-sky-950/60 py-1 px-2 rounded-lg border border-sky-500/20">
        👉 Klik di peta HP untuk tancap Pin 📍 presisi!
      </p>

      {/* Container Peta HP */}
      <div className="w-full h-56 rounded-2xl overflow-hidden border border-sky-500/30 relative bg-slate-950 shadow-inner z-0">
        <MapContainer
          center={[defaultPadang.lat, defaultPadang.lng]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickListener onLocationSelect={handleMapClick} />
          
          {isPinned && (
            <Marker
              position={[pinnedCoords.lat, pinnedCoords.lng]}
              icon={customPinIcon}
            />
          )}
        </MapContainer>

        {/* Realtime Info Bar */}
        <div className="absolute top-2 left-2 right-2 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-sky-500/30 text-center shadow-md">
          <p className="text-[10px] text-sky-300 font-bold">
            {isPinned
              ? `📍 Pin Terpasang: ${pinnedCoords.lat.toFixed(4)}, ${pinnedCoords.lng.toFixed(4)}`
              : "👇 Sentuh di peta untuk pasang pin"}
          </p>
        </div>

        {/* Tombol Kunci Posisi */}
        <div className="absolute bottom-2 left-2 right-2 z-[400]">
          <button
            type="button"
            onClick={handleLockLocation}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-lg transition cursor-pointer border border-sky-400/30"
          >
            📌 Kunci Posisi Pin Ini
          </button>
        </div>
      </div>
    </div>
  );
}