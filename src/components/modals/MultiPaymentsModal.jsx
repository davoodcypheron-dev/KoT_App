
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, ChevronLeft, ChevronRight, Trash2, Banknote, Smartphone, BookOpen, Landmark, Ticket } from 'lucide-react';
import AmountEntryModal from './AmountEntryModal';

import { multiPayTypesDb } from '../../data/mockDb';

const MultiPaymentsModal = ({ 
  isOpen, 
  total, 
  multiPayments, 
  setMultiPayments, 
  onClose, 
  onProcess,
  notify 
}) => {
  const [amountEntry, setAmountEntry] = useState({ show: false, type: null, name: '' });
  const [tempAmount, setTempAmount] = useState('');
  const [isAmountModified, setIsAmountModified] = useState(false);
  const [tempNote, setTempNote] = useState('');

  const getPayTypeIcon = (id) => {
    switch(id) {
      case 'cash': return <Banknote size={20} />;
      case 'card': return <CreditCard size={20} />;
      case 'upi': return <Smartphone size={20} />;
      case 'credit': return <BookOpen size={20} />;
      case 'bank': return <Landmark size={20} />;
      case 'coupon': return <Ticket size={20} />;
      default: return null;
    }
  };

  const multiPayTypes = multiPayTypesDb.map(m => ({
    ...m,
    icon: getPayTypeIcon(m.id)
  })).sort((a, b) => (a.priority || 99) - (b.priority || 99));


  const payTypeScrollRef = useRef(null);
  const scrollPayTypes = (direction) => {
    if (payTypeScrollRef.current) {
      const { scrollLeft } = payTypeScrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200;
      payTypeScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const totalPaid = multiPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
  const balance = total - totalPaid;

  const handleAddPayment = () => {
    const amt = parseFloat(tempAmount);
    if (!amt || amt <= 0) {
      notify('Please enter a valid amount', 'error');
      return;
    }
    if (amt > parseFloat((balance + 0.01).toFixed(2))) { // Small buffer for float issues
      notify(`Amount ₹${amt} exceeds remaining balance ₹${balance.toFixed(2)}`, 'error');
      return;
    }
    const exists = multiPayments.some(p => p.type.toLowerCase() === amountEntry.name.toLowerCase());
    if (exists) {
      notify(`${amountEntry.name} payment already added. Update or Remove existing entry.`, 'warning');
      return;
    }
    setMultiPayments([...multiPayments, { type: amountEntry.name, amount: amt.toFixed(2), note: tempNote, id: Date.now() }]);
    setAmountEntry({ show: false });
    setTempAmount('');
    setTempNote('');
  };

  const removePayment = (id) => {
    setMultiPayments(multiPayments.filter(p => p.id !== id));
  };

  const completeMultiPayment = () => {
    if (Math.abs(balance) > 0.01) {
      const msg = balance > 0
        ? `Pending Balance: ₹${balance.toFixed(2)}. Please collect full amount.`
        : `Overpaid by: ₹${Math.abs(balance).toFixed(2)}. Adjust entries to match total.`;
      notify(msg, 'error');
      return;
    }
    onProcess('Split Payment Settled Successfully!', { method: 'MULTI', isMulti: true, splitPayments: multiPayments });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><CreditCard size={20} /></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Multi-Payment Settlement</h3>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={20} /></button>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 relative shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Select Payment Type</span>
              <div className="h-[1px] flex-1 bg-slate-200/50"></div>
              <div className="flex gap-1">
                <button onClick={() => scrollPayTypes('left')} className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"><ChevronLeft size={14} /></button>
                <button onClick={() => scrollPayTypes('right')} className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"><ChevronRight size={14} /></button>
              </div>
            </div>

            <div
              ref={payTypeScrollRef}
              className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar py-1"
              style={{ gridAutoColumns: 'min-content' }}
            >
              {multiPayTypes.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setAmountEntry({ show: true, type: m.id, name: m.name });
                    setTempAmount(balance.toFixed(2));
                    setIsAmountModified(false);
                  }}
                  className="h-12 min-w-[110px] rounded-xl bg-sky-500 text-white flex items-center justify-center gap-2 px-4 hover:bg-sky-600 shadow-lg shadow-sky-100 transition-all active:scale-95 border-b-2 border-sky-700/30 shrink-0"
                >
                  {m.icon}
                  <span className="text-[10px] font-black tracking-widest uppercase whitespace-nowrap">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="px-6 pt-4 pb-2 shrink-0 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Added Payments</span>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 font-mono">Total Paid: ₹{totalPaid.toFixed(2)}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar min-h-[200px]">
              <div className="bg-white rounded-xl border border-slate-100 shadow-inner overflow-hidden">
                <table className="w-full text-left table-fixed border-separate border-spacing-0">
                  <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[25%] border-b border-slate-200">Type</th>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[30%] border-b border-slate-200">Amount</th>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[30%] border-b border-slate-200">Note</th>
                      <th className="px-6 py-3 w-[15%] border-b border-slate-200"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {multiPayments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic bg-slate-50/30">No transaction records</td>
                      </tr>
                    ) : multiPayments.map(p => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-3 font-black text-slate-700 text-[11px] uppercase truncate">{p.type}</td>
                        <td className="px-6 py-3 font-black text-blue-600 text-xs font-mono tracking-tighter">₹{p.amount}</td>
                        <td className="px-6 py-3 font-bold text-slate-400 text-[9px] italic truncate">{p.note || '-'}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => removePayment(p.id)} className="w-8 h-8 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-sm border border-slate-100 bg-white"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button
              onClick={completeMultiPayment}
              className="w-full h-14 bg-[#0071a1] hover:bg-[#005a81] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all active:scale-[0.98] text-sm"
            >
              Complete Payment
            </button>
          </div>

          <AmountEntryModal 
            isOpen={amountEntry.show}
            name={amountEntry.name}
            tempAmount={tempAmount}
            setTempAmount={setTempAmount}
            tempNote={tempNote}
            setTempNote={setTempNote}
            balance={balance}
            isAmountModified={isAmountModified}
            setIsAmountModified={setIsAmountModified}
            onClose={() => setAmountEntry({ show: false })}
            onAdd={handleAddPayment}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MultiPaymentsModal;
