
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NotesModal = ({ isOpen, onClose }) => {
  const { orderNotes, setOrderNotes } = useApp();
  const [tempNotes, setTempNotes] = useState(orderNotes || '');

  useEffect(() => {
    if (isOpen) {
      setTempNotes(orderNotes || '');
    }
  }, [isOpen, orderNotes]);

  const handleSave = () => {
    setOrderNotes(tempNotes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Clipboard size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Order Notes</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Description</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Comments / Instructions</label>
              <textarea
                autoFocus
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Enter any special instructions or notes for this order..."
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner h-48 resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-4 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
            >Save Notes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotesModal;
