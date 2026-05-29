"use client";
import React from "react";
import ComponentCard from "../../common/ComponentCard";

import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";

export default function DefaultModal() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <div>
      <ComponentCard title="Default Modal">
        <Button size="sm" onClick={openModal}>
          Open Modal
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[600px]"
        >
          <div className="bg-white dark:bg-boxdark rounded-2xl overflow-hidden shadow-2xl border border-stroke dark:border-strokedark w-full mx-auto animate-in zoom-in duration-300">
            {/* Header Modern style from Jadwal */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-boxdark border-b border-stroke dark:border-strokedark flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white uppercase tracking-tight">
                    Modal Heading
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Lengkapi rincian data di bawah ini</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Pellentesque euismod est quis mauris lacinia pharetra. Sed a ligula
                ac odio condimentum aliquet a nec nulla. Aliquam bibendum ex sit
                amet ipsum rutrum feugiat ultrices enim quam.
              </p>
              <p className="mt-5 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Pellentesque euismod est quis mauris lacinia pharetra. Sed a ligula
                ac odio.
              </p>
            </div>

            {/* Footer Modern style from Jadwal */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-stroke dark:border-strokedark flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl text-sm font-black bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/40 transition-all active:scale-95"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </Modal>
      </ComponentCard>
    </div>
  );
}
