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

  // Mulai dengan array kosong untuk mencegah bentrok SSR Next.js
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  
  // State indikator supaya cache HP tidak terhapus duluan saat awal muat
  const [isAppReady, setIsAppReady] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. BACA CACHE LOKAL (INSTAN 0 DETIK) & SYNC SUPABASE
  useEffect(() => {
    // --- TAMPILKAN DARI MEMORI HP LEBIH DULU ---
    try {
      const cachedMemories = window.localStorage.getItem("our_memories_cache");
      if (cachedMemories) setMemories(JSON.parse(cachedMemories));

      const cachedBucket = window.localStorage.getItem("our_bucket_cache");
      if (cachedBucket) setBucketItems(JSON.parse(cachedBucket));
    } catch (e) {
      console.warn("Gagal baca cache lokal:", e);
    }

    // Tandai bahwa cache sudah berhasil dibaca
    setIsAppReady(true);

    // --- DIAM-DIAM TARIK DATA BARU DARI SUPABASE DI BACKGROUND ---
    async function syncDataFromSupabase() {
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
        console.error("Background sync error:", err);
      }
    }

    syncDataFromSupabase();
  }, []);

  // 2. SIMPAN OTOMATIS KE HP HANYA JIKA APP SUDAH READY
  // (Mencegah data tertimpa array kosong saat aplikasi pertama dirender)
  useEffect(() => {
    if (isAppReady) {
      try {
        window.localStorage.setItem("our_memories_cache", JSON.stringify(memories));
      } catch (error) {
        console.warn("Gagal menyimpan cache memori ke HP:", error);
      }
    }
  }, [memories, isAppReady]);

  useEffect(() => {
    if (isAppReady) {
      try {
        window.localStorage.setItem("our_bucket_cache", JSON.stringify(bucketItems));
      } catch (error) {
        console.warn("Gagal menyimpan cache bucket ke HP:", error);
      }
    }
  }, [bucketItems, isAppReady]);

  // 4. Tambah Memory & Simpan ke Supabase
  const handleAddMemory = async (newMemory: MemoryItem) => {
    setMemories((prev) => [newMemory, ...prev]);
    showToast("✨ Memory indah kalian berhasil disimpan!");

    await supabase.from("memories").insert([
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
  };

  // 5. Hapus Memory dari Supabase
  const handleDeleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((item) => item.id !== id));
    showToast("🗑️ Kenangan berhasil dihapus!");

    await supabase.from("memories").delete().eq("id", id);
  };

  // 6. Tambah Bucket List & Simpan ke Supabase
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
  };

  // 7. Update Status Checklist ke Supabase
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

  // 8. Hapus Bucket List dari Supabase
  const handleDeleteItem = async (id: string) => {
    setBucketItems((prev) => prev.filter((item) => item.id !== id));
    showToast("🗑️ Impian berhasil dihapus!");

    await supabase.from("bucket_list").delete().eq("id", id);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative pb-32 overflow-x-hidden select-none">
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-sky-500/10 blur-[120px] pointer-events-none rounded-full z-0" />
      <div className="fixed bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] pointer-events-none rounded-full z-0" />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <div className="relative z-10 max-w-md mx-auto">
        <DashboardHeader />

        <div className="px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {activeTab === "home" && (
                <CameraHome
                  memories={memories}
                  onAddMemory={handleAddMemory}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onShowToast={showToast}
                />
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
