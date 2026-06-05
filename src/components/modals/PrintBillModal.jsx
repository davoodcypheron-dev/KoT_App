
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X } from 'lucide-react';

const PrintBillModal = ({ isOpen, onConfirm, onCancel, title = "Print Receipt", message = "Would you like to print the receipt now?" }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-8 text-center"
        >
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
            <Printer size={40} className="-rotate-3" />
          </div>

          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-2">{title}</h2>
          <p className="text-[10px] font-black text-slate-400 mb-8 leading-relaxed uppercase tracking-widest">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-extrabold rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              No, Skip
            </button>
            <button
              onClick={onConfirm}
              className="flex-[1.5] py-4 bg-[#1e56a0] hover:bg-[#16427a] text-white font-extrabold rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase text-[12px] tracking-widest"
            >
              Yes, Print
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PrintBillModal;
