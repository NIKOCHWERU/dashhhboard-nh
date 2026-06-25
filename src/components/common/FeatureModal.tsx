"use client";
import React from "react";
import { CloseIcon } from "@/icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export const FeatureModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle = "Lengkapi rincian data di bawah ini",
  icon,
  children,
  width = "max-w-2xl"
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[12px] animate-in fade-in duration-300">
      <div 
        className={`bg-white dark:bg-boxdark w-full ${width} rounded-2xl shadow-2xl border border-gray-250 dark:border-white/[0.08] overflow-hidden animate-in zoom-in duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modern style from Jadwal */}
        <div className="px-8 py-6 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark flex justify-between items-center">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-black dark:text-white uppercase tracking-tight">{title}</h3>
              <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors focus:ring-2 focus:ring-brand-500/50 outline-none"
            aria-label="Tutup"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
