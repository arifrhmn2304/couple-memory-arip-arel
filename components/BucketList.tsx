// components/BucketList.tsx
"use client";

import { useState } from "react";
import { Sparkles, Plus, CheckCircle2, Circle, Trash2, Utensils, Plane, Tv, ShoppingBag, Palette, AlertTriangle } from "lucide-react";

export interface BucketItem {
  id: string;
  title: string;
  category: "Kuliner" | "Jalan-jalan" | "Hiburan" | "Belanja" | "Kegiatan";
  completed: boolean;
}

interface BucketListProps {
  items?: BucketItem[];
  onAddItem?: (newItem: BucketItem) => void;
  onToggleItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
}

export default function BucketList({
  items = [],
  onAddItem,
  onToggleItem,
  onDeleteItem,
}: BucketListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BucketItem["category"]>("Kuliner");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const safeItems = items || [];
  const completedCount = safeItems.filter((i) => i?.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: BucketItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: selectedCategory,
      completed: false,
    };

    if (onAddItem) onAddItem(newItem);
    setNewTitle("");
  };

  const handleConfirmDelete = () => {
    if (deleteId && onDeleteItem) {
      onDeleteItem(deleteId);
    }
    setDeleteId(null);
  };

  const getCategoryBadge = (category: BucketItem["category"]) => {
    switch (category) {
      case "Kuliner":
        return { bg: "bg-amber-950/80 text-amber-300 border-amber-500/30", icon: <Utensils className="w-3 h-3"/> };
      case "Jalan-jalan":
        return { bg: "bg-sky-950/80 text-sky-300 border-sky-500/30", icon: <Plane className="w-3 h-3"/> };
      case "Hiburan":
        return { bg: "bg-purple-950/80 text-purple-300 border-purple-500/30", icon: <Tv className="w-3 h-3"/> };
      case "Belanja":
        return { bg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30", icon: <ShoppingBag className="w-3 h-3"/> };
      case "Kegiatan":
        return { bg: "bg-indigo-950/80 text-indigo-300 border-indigo-500/30", icon: <Palette className="w-3 h-3"/> };
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-24 space-y-4">
      {/* Banner Title */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-blue-950/90 backdrop-blur-2xl p-4 rounded-3xl border border-sky-500/30 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse"/>
            <h3 className="text-sm font-bold text-white">Dream To-Do List🎯</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Mimpi & rencana kencan kita berdua</p>
        </div>

        <div className="bg-slate-950 px-3 py-1.5 rounded-2xl border border-sky-500/30 text-center shadow-inner">
          <span className="text-xs font-bold text-sky-400">
            {completedCount}/{safeItems.length}
          </span>
          <p className="text-[9px] font-medium text-slate-400">Selesai</p>
        </div>
      </div>

      {/* Form Input Tambah Wishlist */}
      <form onSubmit={handleSubmit} className="bg-slate-900/95 backdrop-blur-2xl p-4 rounded-3xl border border-sky-500/30 space-y-3 shadow-xl">
        <div>
          <label className="text-[11px] font-semibold text-slate-200 block mb-1">Tambah Impian Baru</label>
          <input
            type="text"
            placeholder="Contoh: Try out cafe baru, jalan-jalan..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-700 focus:outline-none focus:border-sky-400 bg-slate-950 text-white transition placeholder:text-slate-500 shadow-inner"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as BucketItem["category"])}
            className="text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 font-medium focus:outline-none focus:border-sky-400 shadow-inner cursor-pointer"
          >
            <option value="Kuliner">🍔 Kuliner</option>
            <option value="Jalan-jalan">✈️ Jalan-jalan</option>
            <option value="Hiburan">🎬 Hiburan</option>
            <option value="Belanja">🛍️ Belanja</option>
            <option value="Kegiatan">🎨 Kegiatan</option>
          </select>

          <button
            type="submit"
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-sky-500/20 transition active:scale-95 flex items-center gap-1 cursor-pointer border border-sky-400/30"
          >
            <Plus className="w-4 h-4"/>
            Tambah
          </button>
        </div>
      </form>

      {/* List Item Wishlist */}
      <div className="space-y-2.5">
        {safeItems.length === 0 ? (
          <div className="bg-slate-900/85 backdrop-blur-xl p-8 rounded-3xl border border-dashed border-sky-500/30 text-center space-y-2">
            <span className="text-3xl">✨</span>
            <p className="text-xs font-semibold text-white">Belum ada rencana di To-Do list</p>
            <p className="text-[10px] text-slate-400">Yuk tulis wishlist kencan kita di atas!</p>
          </div>
        ) : (
          safeItems.map((item) => {
            const badge = getCategoryBadge(item.category);
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                  item.completed
                    ? "bg-slate-950/60 border-slate-800 opacity-50"
                    : "bg-slate-900/95 border-sky-500/30 text-white shadow-lg hover:border-sky-400/50"
                }`}
              >
                {/* Checkbox & Judul Teks (Bisa Turun ke Bawah / Wrap) */}
                <div
                  onClick={() => onToggleItem && onToggleItem(item.id)}
                  className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <button type="button" className="text-sky-400 transition cursor-pointer mt-0.5 shrink-0">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950"/>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-sky-400"/>
                    )}
                  </button>

                  <span
                    className={`text-xs font-medium break-words whitespace-normal leading-relaxed ${
                      item.completed ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Badge Category & Tombol Hapus */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${badge.bg}`}
                  >
                    {badge.icon}
                    {item.category}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(item.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-xl transition cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POPUP KONFIRMASI HAPUS TO-DO LIST */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-rose-950/80 text-rose-400 rounded-2xl mx-auto flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6"/>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Hapus Rencana Ini?</h3>
              <p className="text-xs text-slate-400">
                Impian atau to-do list ini akan dihapus dari daftar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}