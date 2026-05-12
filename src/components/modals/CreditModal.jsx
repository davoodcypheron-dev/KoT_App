
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Tag } from 'lucide-react';
import { ledgersDb } from '../../data/mockDb';

const CreditModal = ({ isOpen, onClose, onProcess }) => {
  const [selectedLedgerId, setSelectedLedgerId] = useState(ledgersDb[0]?.id || '');
  const [regNo, setRegNo] = useState('');
  const [error, setError] = useState('');

  const selectedLedger = ledgersDb.find(l => l.id === selectedLedgerId);
  const isRegSales = selectedLedger?.name === 'Reg Sales';

  useEffect(() => {
    if (!isRegSales) {
      setRegNo('');
      setError('');
    }
  }, [isRegSales]);

  const validateRegNo = (value) => {
    if (!isRegSales) return true;
    if (!value) {
      setError('Registration Number is mandatory for Reg Sales');
      return false;
    }
    const regExp = /^\d{2}[a-zA-Z0-9]{13}$/;
    if (!regExp.test(value)) {
      setError('Must start with 2 digits followed by 13 alphanumeric chars (15 total)');
      return false;
    }
    setError('');
    return true;
  };

  const handleSettle = () => {
    if (isRegSales && !validateRegNo(regNo)) {
      return;
    }
    onProcess(`Settled to ${selectedLedger?.name || 'Credit Ledger'}`, { 
      method: selectedLedger?.name || 'Credit Ledger', 
      isMulti: false,
      regNo: isRegSales ? regNo : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm text-left">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full relative">
          <h3 className="text-xl font-black text-slate-800 mb-8 text-center">Select Settlement Ledger</h3>
          
          <div className="space-y-6 mb-8">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Ledger</label>
              <div className="relative">
                <select 
                  value={selectedLedgerId}
                  onChange={(e) => setSelectedLedgerId(e.target.value)}
                  className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-slate-700 outline-none appearance-none focus:bg-white transition-all"
                >
                  {ledgersDb.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {isRegSales && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="relative"
              >
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Reg. Number (TRN/VAT)</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => {
                      setRegNo(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="2 digits + 13 alphanumeric..."
                    maxLength={15}
                    className={`w-full bg-slate-50 border ${error ? 'border-rose-500' : 'border-slate-100'} rounded-2xl h-14 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner`}
                  />
                </div>
                {error && (
                  <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1">{error}</p>
                )}
              </motion.div>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 h-16 rounded-2xl font-black text-slate-400 uppercase text-[12px] tracking-widest hover:bg-slate-50">Cancel</button>
            <button 
              onClick={handleSettle} 
              className="flex-[2] h-16 rounded-2xl bg-blue-600 text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-blue-100 active:scale-95"
            >
              Settle to Ledger
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreditModal;

