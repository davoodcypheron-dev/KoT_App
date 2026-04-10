
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ledgersDb } from '../../data/mockDb';

const CreditModal = ({ isOpen, onClose, onProcess }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm text-left">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full relative">
          <h3 className="text-xl font-black text-slate-800 mb-8 text-center">Select Settlement Ledger</h3>
          <div className="relative mb-8">
            <select className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-slate-700 outline-none appearance-none focus:bg-white transition-all">
              {ledgersDb.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 h-16 rounded-2xl font-black text-slate-400 uppercase text-[12px] tracking-widest hover:bg-slate-50">Cancel</button>
            <button onClick={() => onProcess(`Settled to Credit Ledger`)} className="flex-[2] h-16 rounded-2xl bg-blue-600 text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-blue-100 active:scale-95">Settle to Ledger</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreditModal;
