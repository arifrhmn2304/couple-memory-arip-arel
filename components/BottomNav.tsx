// components/BottomNav.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, CalendarDays, Camera, Target, MapPin } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const tabs = [
    { id: "feed", label: "Kenangan", icon: Heart },
    { id: "calendar", label: "Kalender", icon: CalendarDays },
    { id: "home", label: "Kamera", icon: Camera },
    { id: "bucket", label: "To-Do List", icon: Target },
    { id: "map", label: "Lokasi", icon: MapPin },
  ];

  return (
    <div 
      className={`fixed left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm transition-all duration-500 ease-in-out ${
        isVisible ? "bottom-15 opacity-100 translate-y-0" : "-bottom-24 opacity-0 translate-y-10"
      }`}
    >
      <nav className="bg-slate-900/90 backdrop-blur-2xl border border-sky-500/30 p-2 rounded-3xl shadow-2xl shadow-black/90 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative py-2.5 px-3 flex-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 z-10 transition-colors ${
                  isActive ? "text-white" : "text-slate-400 hover:text-sky-400"
                }`}
              />
              
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[9px] font-bold z-10 text-white mt-1 tracking-tight"
                >
                  {tab.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}