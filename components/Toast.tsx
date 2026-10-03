// components/Toast.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  // Deteksi otomatis tipe berdasarkan isi pesan jika type tidak disetel manual
  const isError = type === "error" || (message && (message.includes("⚠️") || message.includes("Gagal") || message.includes("hapus")));
  
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm pointer-events-none"
        >
          <div
            className={`flex items-center gap-3 p-3.5 rounded-2xl shadow-2xl backdrop-blur-2xl border pointer-events-auto ${
              !isError
                ? "bg-slate-900/90 border-sky-500/30 text-white shadow-sky-500/20"
                : "bg-red-950/90 border-red-500/40 text-red-200 shadow-red-500/20"
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                !isError ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {!isError ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            
            <p className="text-xs font-semibold flex-1 tracking-wide">{message}</p>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}