
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, AlertCircle, X, Check, ShieldCheck, Minus, Plus, Lock } from 'lucide-react';
import { usersDb, authUsersDb, initialConfig } from '../../data/mockDb';
import AuthorizerModal from './AuthorizerModal';

const VoidItemModal = ({ isOpen, item, onClose, onConfirm, hasPermission = false, notify }) => {
  const activeAuthorizer = authUsersDb.find(a => a.id === initialConfig.activeUserId);
  const userHasPermission = true;
  //const userHasPermission = hasPermission || (activeAuthorizer?.cancelKot || false);

  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showAuthorizer, setShowAuthorizer] = useState(false);
  const [cancelQty, setCancelQty] = useState(item?.qty || 1);

  React.useEffect(() => {
    if (isOpen && item) {
      setCancelQty(item.qty);
    }
  }, [isOpen, item]);

  const quickReasons = ['Guest Change Mind', 'Delayed Order', 'Kitchen Mistake', 'Wrong Item Entry'];

  const handleConfirm = () => {
    const finalReason = reason && customReason.trim()
      ? `${reason}: ${customReason.trim()}`
      : customReason.trim() || reason;

    if (!finalReason) {
      return notify('Please select a reason or type details for cancellation', 'error');
    }

    if (!userHasPermission) {
      setShowAuthorizer(true);
      return;
    }

    onConfirm(item, finalReason, cancelQty);
    resetAndClose();
  };

  const handleAuthorized = (authorizer) => {
    const finalReason = reason && customReason.trim()
      ? `${reason}: ${customReason.trim()}`
      : customReason.trim() || reason;

    onConfirm(item, finalReason, cancelQty);
    setShowAuthorizer(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setReason('');
    setCustomReason('');
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
          onClick={resetAndClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 bg-rose-50/50 border-b border-rose-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                <Ban size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{item?.cartId === 'ALL' ? 'Void Order' : 'Cancel Item'}</h2>
                <p className="text-[13px] font-bold text-rose-400 uppercase tracking-widest leading-none mt-1">{item?.name}</p>
              </div>
            </div>
            <button onClick={resetAndClose} className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm hover:text-rose-500 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-6">
            <div className="space-y-6">
              {/* Quick Reasons */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Select Reason</label>
                <div className="grid grid-cols-2 gap-2">
                  {quickReasons.map(r => (
                    <button
                      key={r}
                      onClick={() => { setReason(r); setCustomReason(''); }}
                      className={`h-10 px-4 rounded-xl border-2 font-bold text-[11px] uppercase tracking-wider transition-all text-left flex items-center justify-between ${reason === r && !customReason ? 'bg-rose-600 border-rose-700 text-white shadow-lg' : 'bg-rose-100 border-rose-100 text-rose-500 hover:bg-rose-100'}`}
                    >
                      {r}
                      {reason === r && !customReason && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  Cancellation Detail {reason ? '(Optional)' : '(Mandatory)'}
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type specific reason for kitchen..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-rose-300 transition-all shadow-inner h-18 resize-none"
                />
              </div>

              {/* Quantity Selector - Hidden for Full Order */}
              {item?.cartId !== 'ALL' && (
                <div className="bg-slate-50 p-3 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cancel Quantity</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCancelQty(Math.max(1, cancelQty - 1))}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition-all shadow-sm"
                      >
                        <Minus size={20} />
                      </button>
                      <input
                        type="text"
                        value={cancelQty}
                        className="w-16 h-12 px-4 text-center text-slate-600 font-bold text-[18px] uppercase tracking-wider border border-slate-200 rounded-2xl"
                        readOnly
                      />
                      <button
                        onClick={() => setCancelQty(Math.min(item?.qty, cancelQty + 1))}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition-all shadow-sm"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  {cancelQty === item?.qty ? (
                    <p className="mt-4 text-center text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 py-2 rounded-lg">Full Item Void</p>
                  ) : (
                    <p className="mt-4 text-center text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 py-2 rounded-lg">Partial Void ({item?.qty - cancelQty} will remain)</p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
            <button
              onClick={resetAndClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-[2] py-4 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest shadow-m active:scale-95 transition-all flex items-center justify-center gap-2 ${userHasPermission ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'}`}
            >
              {userHasPermission ? <Check size={18} /> : <Lock size={16} />}
              {userHasPermission ? 'Confirm Cancellation' : 'Request Authorization'}
            </button>
          </div>
        </motion.div>

        {showAuthorizer && (
          <AuthorizerModal
            isOpen={showAuthorizer}
            onClose={() => setShowAuthorizer(false)}
            onAuthorize={handleAuthorized}
            permissionKey="cancelKot"
            title="Cancel Item Auth"
            message={`Manager authorization required to cancel ${item?.name} x ${cancelQty}.`}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

export default VoidItemModal;
