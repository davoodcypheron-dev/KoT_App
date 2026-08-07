import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, ScanLine, AlertCircle } from 'lucide-react';

const QrScanModal = ({ isOpen, onClose, onScanSuccess }) => {
  const inputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep input focused at all times
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const focusInput = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      // Short delay to ensure modal is mounted before focusing
      const timer = setTimeout(focusInput, 200);
      
      // Keep focusing if the user clicks anywhere in the document
      const handleGlobalClick = () => {
        focusInput();
      };
      
      document.addEventListener('click', handleGlobalClick);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) {
        onScanSuccess(val);
        e.target.value = '';
      }
    }
  };

  const handlePaste = (e) => {
    // Small timeout to allow input value to update before reading it
    setTimeout(() => {
      if (inputRef.current) {
        const val = inputRef.current.value.trim();
        if (val) {
          onScanSuccess(val);
          inputRef.current.value = '';
        }
      }
    }, 50);
  };

  return (
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
        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-8 items-center"
      >
        {/* Hidden Input for scanner focus */}
        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0 pointer-events-none"
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          autoComplete="off"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Invoice Scanner</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Scan QR Code</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1 max-w-[280px]">
            Position the invoice QR code in front of your scanner.
          </p>
        </div>

        {/* Scanner Viewfinder Area */}
        <div className="relative w-56 h-56 rounded-[2rem] bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden mb-6 shadow-inner group">
          {/* Decorative Corner Targets */}
          <div className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-md" />
          <div className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-md" />
          <div className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-md" />
          <div className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-md" />

          {/* QR Icon */}
          <div className="text-slate-300 group-hover:text-slate-400 transition-colors duration-300">
            <QrCode size={110} strokeWidth={1.5} />
          </div>

          {/* Sweeping Laser Line */}
          <motion.div
            animate={{
              top: ['15%', '85%', '15%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)]"
          />

          {/* Connection Status indicator */}
          <div className="absolute bottom-4 text-[9px] font-black uppercase tracking-wider text-slate-400 animate-pulse bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200/50 backdrop-blur-sm">
            Scanner Active
          </div>
        </div>

        {/* Input Helper Feedback */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-3">
          <ScanLine className="text-blue-500 animate-pulse shrink-0" size={16} />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Ready to receive input...
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default QrScanModal;
