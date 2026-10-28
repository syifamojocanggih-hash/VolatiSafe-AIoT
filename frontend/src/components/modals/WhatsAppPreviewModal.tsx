'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Smartphone,
  CheckCheck,
  Send,
  Loader2,
  CheckCircle2,
  Radio,
  BellRing,
  Info
} from 'lucide-react';
import {
  getNotificationPreview,
  dispatchNotificationAlert,
  NotificationPreviewResponse,
  DispatchAlertResponse,
} from '@/services/api';

type AlertType = 'h_minus_3' | 'critical' | 'daily_digest';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId?: string;
  defaultAlertType?: AlertType;
  messageText?: string;
  onNavigateWindow?: () => void;
  onNavigateCalculator?: () => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  fieldId = 'BLOK-A',
  defaultAlertType = 'h_minus_3',
  messageText: fallbackMessageText,
  onNavigateWindow,
  onNavigateCalculator,
}) => {
  const [activeTab, setActiveTab] = useState<AlertType>(defaultAlertType);
  const [previewData, setPreviewData] = useState<NotificationPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchAlertResponse | null>(null);

  // Sync tab with defaultAlertType when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultAlertType);
      setDispatchResult(null);
    }
  }, [isOpen, defaultAlertType]);

  // Load preview data from backend
  const loadPreview = useCallback(async (type: AlertType) => {
    setIsLoading(true);
    setDispatchResult(null);
    try {
      const data = await getNotificationPreview(fieldId, type);
      if (data) {
        setPreviewData(data);
      }
    } catch {
      // Keep previous or fallback
    } finally {
      setIsLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    if (isOpen) {
      loadPreview(activeTab);
    }
  }, [isOpen, activeTab, loadPreview]);

  // Dispatch simulated alert
  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await dispatchNotificationAlert(fieldId, activeTab);
      if (res) {
        setDispatchResult(res);
      }
    } catch {
      // error handling
    } finally {
      setIsDispatching(false);
    }
  };

  if (!isOpen) return null;

  // Determine displayed message
  const displayedMessage =
    previewData?.message_text ||
    fallbackMessageText ||
    'Memuat rekomendasi notifikasi petani langsung dari AI Engine...';

  const scheduledTime = previewData?.scheduled_time || '05:30 WIB';
  const farmerName = previewData?.farmer_name || 'Pak Suparman';
  const phoneNumber = previewData?.phone_number || '+6281234567890';
  const fieldName = previewData?.field_name || 'Kebun Jagung Blok A';
  const avriScore = previewData?.avri_score ?? 23.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#111B21] text-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-700/80 overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#202C33] border-b border-slate-700/70 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Kanal Notifikasi Petani (WhatsApp & Telegram)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Tutup preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient & Metadata Strip */}
        <div className="px-4 py-2 bg-[#182229] border-b border-slate-800 text-3xs text-slate-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200 truncate">
              {farmerName} · {phoneNumber}
            </span>
            <span className="text-slate-400 hidden sm:inline">({fieldName})</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800 text-3xs font-bold uppercase shrink-0">
            AVRI {avriScore.toFixed(1)}%
          </span>
        </div>

        {/* Alert Type Switcher Tabs */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1A242B] border-b border-slate-700/60 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('h_minus_3')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'h_minus_3'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202C33]'
            }`}
          >
            <span>🌾 Logistik H-3</span>
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'critical'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202C33]'
            }`}
          >
            <span>🔴 Alert Kritis</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_digest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'daily_digest'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202C33]'
            }`}
          >
            <span>☀️ Harian 05:30</span>
          </button>
        </div>

        {/* WhatsApp Chat Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#202C33] shrink-0 border-b border-slate-700/40">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="VolatiSafe Bot Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              VolatiSafe Bot
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </h4>
            <p className="text-3xs text-emerald-300 font-medium truncate flex items-center gap-1">
              <Radio className="w-2.5 h-2.5" />
              Bot Resmi Peringatan Dini Petani (Fonnte/Wablas & Telegram)
            </p>
          </div>
        </div>

        {/* WhatsApp Chat Body */}
        <div className="p-4 bg-[#0B141A] flex-1 overflow-y-auto space-y-3 min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Mengambil format pesan preskriptif dari backend AI...</span>
            </div>
          ) : (
            <>
              {/* Message Bubble */}
              <div className="bg-[#202C33] rounded-2xl rounded-tl-xs p-3.5 max-w-[94%] shadow-md border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 pb-1.5">
                  <span className="text-2xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <BellRing className="w-3 h-3" />
                    {previewData?.title ||
                      (activeTab === 'h_minus_3'
                        ? '🌾 PENGINGAT H-3 LOGISTIK PUPUK'
                        : activeTab === 'critical'
                        ? '🔴 PERINGATAN RISIKO KRITIS'
                        : '☀️ PRESKRIPSI JENDELA AMAN HARIAN')}
                  </span>
                  <span className="text-3xs text-slate-400 font-mono">
                    {previewData?.risk_category ? previewData.risk_category.toUpperCase() : 'AI RECOM'}
                  </span>
                </div>

                <div className="text-xs text-slate-100 leading-relaxed whitespace-pre-line font-sans font-normal">
                  {displayedMessage}
                </div>

                <div className="flex items-center justify-end gap-1.5 text-3xs text-slate-400 pt-1 border-t border-slate-700/30">
                  <span>{scheduledTime}</span>
                  <CheckCheck
                    className={`w-3.5 h-3.5 ${
                      dispatchResult?.dispatched ? 'text-sky-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Status Alert Dispatch Banner if sent */}
              {dispatchResult && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-2xs space-y-1 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>✓ Berhasil Diproses oleh AlertDispatcher</span>
                  </div>
                  <p className="text-3xs text-emerald-300/80 leading-normal">
                    Penerima: <strong>{dispatchResult.recipient}</strong> · Kanal: {dispatchResult.channels.join(', ')}
                  </p>
                  <p className="text-3xs text-slate-300/70 italic border-t border-emerald-800/50 pt-1">
                    {dispatchResult.note}
                  </p>
                </div>
              )}

              {/* Quick Reply CTA Pills */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateWindow) onNavigateWindow();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-xs font-semibold text-emerald-400 text-center border border-slate-700 transition-colors cursor-pointer"
                >
                  Cek Jendela Jam Aman Hari Ini
                </button>
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateCalculator) onNavigateCalculator();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-xs font-semibold text-slate-300 text-center border border-slate-700 transition-colors cursor-pointer"
                >
                  Buka Takaran Ember & Karung
                </button>
              </div>
            </>
          )}
        </div>

        {/* Action Dispatcher Footer */}
        <div className="p-3 bg-[#1F2C34] border-t border-slate-700/80 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm ${
                isDispatching
                  ? 'bg-emerald-800 text-emerald-200 cursor-wait'
                  : 'bg-[#00A884] hover:bg-[#008f70] text-white cursor-pointer'
              }`}
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim ke Gateway...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Notifikasi Uji Coba (Sandbox Gateway)</span>
                </>
              )}
            </button>
          </div>

          {/* Honesty & Sandbox Boundary Note */}
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-3xs text-slate-400 leading-tight">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Batas Kejujuran (TKT-3):</strong> Integrasi WhatsApp & Telegram beroperasi penuh di backend AlertDispatcher. Pengiriman SMS/WA fisik ke nomor Pak Suparman disimulasikan agar tidak menimbulkan spam selama pengujian demo juri.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
