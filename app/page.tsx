// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import MemoryFeed from "@/components/MemoryFeed";
import BucketList, { BucketItem } from "@/components/BucketList";
import MemoryMap from "@/components/MemoryMap";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import CalendarTimeline from "@/components/CalendarTimeLine";
import CameraHome from "@/components/CameraHome";
import { MemoryItem } from "@/components/AddMemoryModal";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [isAppReady, setIsAppReady] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAllData = async () => {
    try {
      const { data: memData } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (memData) {
        const formattedMemories: MemoryItem[] = memData.map((m: any) => ({
          id: m.id,
          author: m.author,
          avatar: m.avatar,
          date: m.date,
          location: m.location,
          imageUrl: m.image_url,
          caption: m.caption,
          lat: m.lat,
          lng: m.lng,
        }));
        setMemories(formattedMemories);
      }

      const { data: bucketData } = await supabase
        .from("bucket_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (bucketData) {
        setBucketItems(bucketData);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
    }
  };

  useEffect(() => {
    // Bersihkan localStorage yang kepenuhan jika ada
    try {
      window.localStorage.removeItem("our_memories_cache");
    } catch (e) {
      // ignore
    }

    fetchAllData().finally(() => {
      setTimeout(() => {
        setIsAppReady(true);
      }, 600);
    });

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memories" },
        () => { fetchAllData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bucket_list" },
        () => { fetchAllData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddMemory = async (newMemory: MemoryItem) => {
    setMemories((prev) => [newMemory, ...prev]);
    showToast("✨ Memory indah kalian berhasil disimpan!");

    const { error } = await supabase.from("memories").insert([
      {
        id: newMemory.id,
        author: newMemory.author,
        avatar: newMemory.avatar,
        date: newMemory.date,
        location: newMemory.location,
        image_url: newMemory.imageUrl,
        caption: newMemory.caption,
        lat: newMemory.lat,
        lng: newMemory.lng,
      },
    ]);

    if (error) {
      showToast("⚠️ Gagal menyimpan ke server.");
    } else {
      fetchAllData();
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((item) => item.id !== id));
    showToast("🗑️ Kenangan berhasil dihapus!");

    await supabase.from("memories").delete().eq("id", id);
    fetchAllData();
  };

  const handleAddItem = async (newItem: BucketItem) => {
    setBucketItems((prev) => [newItem, ...prev]);
    showToast("🎯 Impian baru berhasil ditambahkan!");

    await supabase.from("bucket_list").insert([
      {
        id: newItem.id,
        title: newItem.title,
        category: newItem.category,
        completed: newItem.completed,
      },
    ]);
    fetchAllData();
  };

  const handleToggleItem = async (id: string) => {
    const targetItem = bucketItems.find((item) => item.id === id);
    if (!targetItem) return;

    const updatedStatus = !targetItem.completed;

    setBucketItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: updatedStatus } : item
      )
    );

    await supabase
      .from("bucket_list")
      .update({ completed: updatedStatus })
      .eq("id", id);
  };

  const handleDeleteItem = async (id: string) => {
    setBucketItems((prev) => prev.filter((item) => item.id !== id));
    showToast("🗑️ Impian berhasil dihapus!");

    await supabase.from("bucket_list").delete().eq("id", id);
    fetchAllData();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-x-hidden select-none flex flex-col items-center">
      
      {/* SPLASH SCREEN / ANIMASI PEMBUKA DENGAN LOGO KUSTOM */}
      <AnimatePresence>
        {!isAppReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="relative flex flex-col items-center space-y-5">
              <div className="absolute w-28 h-28 bg-sky-500/25 rounded-full blur-2xl animate-pulse" />
              
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative z-10 w-24 h-24 rounded-[32px] overflow-hidden shadow-2xl shadow-sky-950 border border-sky-500/30 flex items-center justify-center bg-slate-900"
              >
                <img
                  src="/icon-512.png"
                  alt="Our Memories Logo"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <div className="text-center space-y-1.5 z-10">
                <h1 className="text-base font-black tracking-widest text-white">OUR MEMORIES</h1>
                <p className="text-[11px] text-sky-400 font-medium tracking-[0.2em] uppercase animate-pulse">
                  Loading Our Story...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-sky-500/10 blur-[120px] pointer-events-none rounded-full z-0" />
      <div className="fixed bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] pointer-events-none rounded-full z-0" />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen px-4 pb-28">
        <DashboardHeader />

        <div className="w-full flex-1 mt-2 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full flex-1 flex flex-col"
            >
              {activeTab === "home" && (
                <div className="w-full flex-1 flex flex-col justify-center items-center my-auto">
                  <CameraHome
                    memories={memories}
                    onAddMemory={handleAddMemory}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onShowToast={showToast}
                  />
                </div>
              )}

              {activeTab === "feed" && (
                <MemoryFeed
                  memories={memories}
                  onDeleteMemory={handleDeleteMemory}
                  onShowToast={showToast}
                />
              )}
              
              {activeTab === "calendar" && (
                <CalendarTimeline 
                  memories={memories} 
                  onShowToast={showToast}
                />
              )}

              {activeTab === "bucket" && (
                <BucketList
                  items={bucketItems}
                  onAddItem={handleAddItem}
                  onToggleItem={handleToggleItem}
                  onDeleteItem={handleDeleteItem}
                />
              )}

              {activeTab === "map" && <MemoryMap memories={memories} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}