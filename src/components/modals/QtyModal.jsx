
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const QtyModal = ({ isOpen, item, tempQty, setTempQty, onClose, onUpdate }) => {
  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 flex flex-col border border-slate-100"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{item.name}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px] mt-2">Update Available Qty</p>
          </div>

          <div className="bg-slate-50 rounded-[2rem] p-4 mb-6 border-2 border-slate-100 shadow-inner flex flex-col items-center">
            <div className="w-full bg-transparent text-center text-5xl font-black text-blue-600 leading-none">
              {tempQty === '' ? '0' : tempQty}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => setTempQty(prev => (prev.length < 4 ? prev + n : prev))}
                className="h-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-700 active:bg-blue-50 transition-all shadow-sm"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setTempQty('')}
              className="h-14 bg-rose-50 text-rose-500 border-2 border-rose-100 rounded-2xl font-black text-[12px] uppercase active:bg-rose-100 tracking-widest transition-all"
            >
              Clear
            </button>
            <button
              onClick={() => setTempQty(prev => (prev.length < 4 ? prev + '0' : prev))}
              className="h-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-700 active:bg-blue-50 transition-all shadow-sm"
            >
              0
            </button>
            <button
              onClick={() => setTempQty(prev => prev.slice(0, -1))}
              className="h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 active:bg-slate-200 flex items-center justify-center text-[12px] uppercase transition-all"
            >
              Back
            </button>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Discard
            </button>
            <button
              onClick={onUpdate}
              className="flex-[2] py-4 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
            >
              Update Qty
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QtyModal;
