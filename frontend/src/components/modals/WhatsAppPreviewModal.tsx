'use client';

import React from 'react';
import { X, Smartphone, CheckCheck, Send } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageText: string;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  messageText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#111B21] text-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-700 overflow-hidden relative">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#202C33] border-b border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Smartphone className="w-4 h-4" />
            <span>Simulasi Tampilan WhatsApp Petani</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Tutup preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#202C33]">
          <div className="w-9 h-9 rounded-full bg-[#00A884] flex items-center justify-center text-white font-bold text-sm">
            VS
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              VolatiSafe Bot
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </h4>
            <p className="text-3xs text-slate-400 truncate">Bot Resmi Notifikasi Petani</p>
          </div>
        </div>

        {/* WhatsApp Chat Body */}
        <div className="p-4 bg-[#0B141A] min-h-[300px] flex flex-col justify-end space-y-3">
          {/* Incoming Message Bubble */}
          <div className="bg-[#202C33] rounded-2xl rounded-tl-xs p-3.5 max-w-[92%] shadow-sm border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-1.5 text-2xs font-bold text-emerald-400 uppercase tracking-wider">
              <span>🌾 PENGINGAT H-3 LOGISTIK PUPUK</span>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed">
              {messageText}
            </p>
            <div className="flex items-center justify-end gap-1 text-3xs text-slate-400 pt-1">
              <span>05:30 WIB</span>
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>

          {/* Quick Reply CTA Pills */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={onClose}
              className="w-full py-2 px-3 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-xs font-semibold text-emerald-400 text-center border border-slate-700 transition-colors"
            >
              Cek Jendela Jam Aman Hari Ini
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-3 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-xs font-semibold text-slate-300 text-center border border-slate-700 transition-colors"
            >
              Buka Takaran Ember Karung
            </button>
          </div>
        </div>

        {/* WhatsApp Input Mock Bar */}
        <div className="px-3 py-2.5 bg-[#202C33] flex items-center gap-2 border-t border-slate-700/60">
          <input
            type="text"
            disabled
            value="Ketik pesan..."
            className="flex-1 bg-[#2A3942] text-xs text-slate-400 px-3 py-2 rounded-full outline-hidden"
          />
          <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center text-white">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
