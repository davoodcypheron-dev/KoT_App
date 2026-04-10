
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';

const AmountEntryModal = ({ 
  isOpen, 
  name, 
  tempAmount, 
  setTempAmount, 
  tempNote, 
  setTempNote, 
  balance, 
  isAmountModified, 
  setIsAmountModified, 
  onClose, 
  onAdd 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xl rounded-3xl shadow-3xl overflow-hidden flex min-h-[400px]">
          {/* Left Panel */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add {name}</h4>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-400"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Amount</label>
                  <div className="relative">
                    <input
                      value={tempAmount}
                      onFocus={(e) => {
                        if (!isAmountModified) {
                          setTempAmount('');
                          setIsAmountModified(true);
                        }
                      }}
                      onChange={(e) => {
                        setTempAmount(e.target.value);
                        setIsAmountModified(true);
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl h-11 px-4 text-lg font-black text-blue-600 outline-none focus:bg-white focus:border-blue-200 transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">₹</div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Reference</label>
                  <input
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="Ref #"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl h-11 px-4 text-xs font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-200 transition-all shadow-inner"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-1 px-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remaining Balance</span>
                    <span className="text-sm font-black text-slate-400 font-mono tracking-tighter">₹{balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-slate-50 mt-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">New Balance After Add</span>
                    <span className={`text-lg font-black font-mono tracking-tighter ${(balance - (parseFloat(tempAmount) || 0)) < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
                      ₹{(balance - (parseFloat(tempAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-slate-50">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-6 h-11 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Discard
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onAdd}
                className="px-8 h-11 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/10 transition-all"
              >
                Update
              </motion.button>
            </div>
          </div>

          {/* Numeric Pad */}
          <div className="w-[240px] bg-slate-50/50 p-6 flex flex-col justify-center items-center border-l border-slate-100 shrink-0">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
                <motion.button
                  key={n}
                  whileHover={{ scale: 1.05, backgroundColor: '#fff' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (n === '.' && tempAmount.includes('.')) return;
                    if (!isAmountModified) {
                      setTempAmount(n === '.' ? '0.' : '' + n);
                      setIsAmountModified(true);
                    } else {
                      setTempAmount(prev => prev === '' && n === '.' ? '0.' : prev + n);
                    }
                  }}
                  className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl font-black text-slate-700 border border-slate-100/50"
                >
                  {n}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#fff' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTempAmount(prev => prev.slice(0, -1))}
                className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 hover:text-rose-500 border border-slate-100/50"
              >
                <Trash2 size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AmountEntryModal;
