// components/Map.tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MemoryItem } from "./AddMemoryModal";
import { Calendar, MapPin } from "lucide-react";

function MapRefresher() {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Fungsi menghitung jarak (meter) antar dua titik koordinat bumi (Haversine Formula)
function hitungJarakMeter(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius bumi dalam meter
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Kembalikan nilai dalam meter
}

interface MapProps {
  memories: MemoryItem[];
}

export default function Map({ memories }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-slate-950 flex items-center justify-center text-xs text-sky-400">
        Memuat Peta... 🗺️
      </div>
    );
  }

  const padangCenter: [number, number] = [-0.9471, 100.4172];

  const centerCoord = memories.length > 0 && memories[0].lat && memories[0].lng 
    ? [memories[0].lat, memories[0].lng] as [number, number] 
    : padangCenter;

  // LOGIKA BARU: CLUSTERING RADIUS 20 METER
  const radiusThreshold = 30; // Batas radius dalam meter
  const groupedMemories: { lat: number; lng: number; items: MemoryItem[] }[] = [];

  memories.forEach((item) => {
    const lat = item.lat || padangCenter[0];
    const lng = item.lng || padangCenter[1];

    // Coba cari apakah ada pin grup yang jaraknya kurang dari 20 meter
    const existingGroup = groupedMemories.find(
      (group) => hitungJarakMeter(group.lat, group.lng, lat, lng) <= radiusThreshold
    );

    if (existingGroup) {
      // Kalau masuk radius, gabungkan ke pin yang sudah ada
      existingGroup.items.push(item);
    } else {
      // Kalau di luar radius, bikin grup pin baru
      groupedMemories.push({
        lat,
        lng,
        items: [item],
      });
    }
  });

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <MapContainer
        key={`${centerCoord[0]}-${centerCoord[1]}-${memories.length}`}
        center={centerCoord}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "400px", width: "100%", borderRadius: "1.75rem", background: "#020617" }}
      >
        <MapRefresher />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {groupedMemories.map((group, index) => {
          const primaryImage = group.items[0].imageUrl;
          const count = group.items.length;

          const photoPinIcon = L.divIcon({
            className: "custom-photo-marker",
            html: `
              <div style="
                position: relative;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                overflow: hidden;
                border: 2.5px solid #38bdf8;
                box-shadow: 0 10px 25px rgba(14, 165, 233, 0.6);
                background: #0f172a;
                cursor: pointer;
              ">
                <img src="${primaryImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                ${count > 1 ? `
                  <div style="
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    background: #0284c7;
                    color: white;
                    font-size: 9px;
                    font-weight: 800;
                    padding: 1px 4px;
                    border-top-left-radius: 6px;
                  ">+${count - 1}</div>
                ` : ''}
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -26],
          });

          return (
            <Marker key={index} position={[group.lat, group.lng]} icon={photoPinIcon}>
              <Popup className="custom-modern-popup">
                <div className="w-60 max-h-[280px] overflow-y-auto space-y-3 p-0.5 no-scrollbar text-slate-100">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-sky-400">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {/* Tampilkan nama lokasi dari foto pertama di grup ini */}
                      <span className="truncate max-w-[140px]">{group.items[0].location}</span>
                    </div>
                    <span className="bg-sky-950/80 px-2 py-0.5 rounded-full text-[9px] border border-sky-500/30 text-sky-300 font-bold">
                      {count} Momen
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {group.items.map((m) => (
                      <div key={m.id} className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800/80 space-y-2 shadow-inner">
                        <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-950 relative">
                          <img
                            src={m.imageUrl}
                            alt={m.location}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-0.5 px-0.5">
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                            <Calendar className="w-2.5 h-2.5 text-sky-400" />
                            <span>{m.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-200 font-normal leading-snug line-clamp-2">
                            {m.caption}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
