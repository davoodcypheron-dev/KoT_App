
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, Banknote, X, Check, Lock, ShieldCheck, Trash2, Delete, ChevronRight } from 'lucide-react';
import AuthorizerModal from './AuthorizerModal';

const DiscountModal = ({ isOpen, onClose, onApply, orderValue, config, notify, preAuthorized = false }) => {
  const [inputType, setInputType] = useState('percentage'); // 'percentage' or 'amount'
  const [inputValue, setInputValue] = useState('');
  const [showAuthorizer, setShowAuthorizer] = useState(false);
  const [currentMaxLimit, setCurrentMaxLimit] = useState(config?.cashierDiscountLimit || 0);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsAuthorized(preAuthorized);
      setCurrentMaxLimit(preAuthorized ? config?.authDiscountLimit : config?.cashierDiscountLimit || 0);
    }
  }, [isOpen, config, preAuthorized]);

  if (!isOpen) return null;

  const calculateDiscount = () => {
    const val = parseFloat(inputValue) || 0;
    if (inputType === 'percentage') {
      const amount = (orderValue * val) / 100;
      return { amount, percentage: val };
    } else {
      const percentage = (val / orderValue) * 100;
      return { amount: val, percentage };
    }
  };

  const { amount: discAmount, percentage: discPerc } = calculateDiscount();
  const discountedValue = orderValue - discAmount;

  const validateAndSet = (valStr) => {
    const numericVal = parseFloat(valStr) || 0;
    const maxPerc = isAuthorized ? (config?.authDiscountLimit || 100) : (config?.cashierDiscountLimit || 0);
    const maxAmt = (orderValue * maxPerc) / 100;

    if (inputType === 'percentage') {
      if (numericVal > maxPerc) {
        setInputValue(maxPerc.toString());
        notify(`Max allowed discount is ${maxPerc}%`, 'warning');
      } else {
        setInputValue(valStr);
      }
    } else {
      if (numericVal > maxAmt) {
        setInputValue(maxAmt.toFixed(2));
        notify(`Max allowed discount is ${config?.currencySymbol}${maxAmt.toFixed(2)} (${maxPerc}%)`, 'warning');
      } else {
        setInputValue(valStr);
      }
    }
  };

  const handleKeyPress = (key) => {
    let newValue = inputValue;
    if (key === 'BACK') {
      newValue = newValue.slice(0, -1);
    } else if (key === 'CLEAR') {
      newValue = '';
    } else if (key === '.') {
      if (!newValue.includes('.')) newValue += '.';
    } else {
      newValue += key;
    }
    validateAndSet(newValue);
  };

  const handleApply = () => {
    if (discPerc > (isAuthorized ? config.authDiscountLimit : config.cashierDiscountLimit)) {
      return notify('Discount exceeds allowed limit', 'error');
    }
    onApply({
      type: inputType,
      value: parseFloat(inputValue) || 0,
      amount: discAmount,
      percentage: discPerc
    });
    onClose();
  };

  const handleAuthorized = (authorizer) => {
    setIsAuthorized(true);
    setCurrentMaxLimit(config.authDiscountLimit);
    setShowAuthorizer(false);
    notify(`Authorized by ${authorizer.name}. Limit increased to ${config.authDiscountLimit}%`, 'success');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
          className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-slate-100"
        >
          {/* Left Side: Controls */}
          <div className="flex-1 p-8 flex flex-col border-r border-slate-50">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Percent size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Discount</h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px] leading-none mt-1">Apply Reductions</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                <span className="text-base font-black text-slate-700">{config.currencySymbol}{orderValue.toFixed(2)}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Final</span>
                <span className="text-base font-black text-emerald-600">{config.currencySymbol}{discountedValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Type Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => { setInputType('percentage'); setInputValue(''); }}
                className={`flex-1 py-2 h-12 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${inputType === 'percentage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => { setInputType('amount'); setInputValue(''); }}
                className={`flex-1 py-2 h-12 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${inputType === 'amount' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Amount ({config.currencySymbol})
              </button>
            </div>

            {/* Input Area */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 rounded-2xl p-3 border-2 border-slate-100 shadow-sm relative">
                  <input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => validateAndSet(e.target.value)}
                    className="w-full bg-transparent text-center text-3xl font-black text-blue-600 outline-none"
                    placeholder="0.00"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">
                    {inputType === 'percentage' ? '%' : config.currencySymbol}
                  </div>
                </div>
                {!isAuthorized ? (
                  <button
                    onClick={() => setShowAuthorizer(true)}
                    className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl border-2 border-amber-100 flex flex-col items-center justify-center hover:bg-amber-100 transition-all active:scale-95"
                  >
                    <Lock size={18} />
                    <span className="text-[8px] font-black uppercase mt-1">Auth</span>
                  </button>
                ) : (
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl border-2 border-emerald-100 flex flex-col items-center justify-center">
                    <ShieldCheck size={20} />
                    <span className="text-[8px] font-black uppercase mt-1">Admin</span>
                  </div>
                )}
              </div>

              <div className="px-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Limit: <span className="text-slate-600">{inputType === 'percentage' ? `${currentMaxLimit}%` : `${config.currencySymbol}${(orderValue * currentMaxLimit / 100).toFixed(2)}`}</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleApply}
                disabled={!inputValue || parseFloat(inputValue) === 0}
                className="flex-[2] py-4 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Right Side: Keypad */}
          <div className="w-72 bg-slate-50/50 p-4 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => handleKeyPress(n.toString())}
                  className="h-15 bg-white border-2 border-slate-100 rounded-xl font-black text-lg text-slate-700 active:bg-blue-50 transition-all shadow-sm"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleKeyPress('CLEAR')}
                className="h-12 bg-rose-50 text-rose-500 border-2 border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest active:bg-rose-100 px-1"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeyPress('0')}
                className="h-12 bg-white border-2 border-slate-100 rounded-xl font-black text-lg text-slate-700 active:bg-blue-50 shadow-sm"
              >
                0
              </button>
              <button
                onClick={() => handleKeyPress('BACK')}
                className="h-12 bg-slate-100 border-2 border-slate-200 rounded-xl font-black text-[10px] text-slate-600 uppercase tracking-widest active:bg-slate-200"
              >
                Back
              </button>
            </div>
          </div>
        </motion.div>

        {showAuthorizer && (
          <AuthorizerModal
            isOpen={showAuthorizer}
            onClose={() => setShowAuthorizer(false)}
            onAuthorize={handleAuthorized}
            permissionKey="discountDisc"
            title="Management Auth"
            message={`Manager authorization required for discounts above ${config.cashierDiscountLimit}%.`}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

export default DiscountModal;
