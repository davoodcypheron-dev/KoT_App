
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Check, AlertCircle } from 'lucide-react';
import { usersDb, authUsersDb } from '../../data/mockDb';

const AuthorizerModal = ({ isOpen, onClose, onAuthorize, permissionKey, title = "Authorization Required", message = "Manager or authorized user credentials required to proceed." }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleAuth = () => {
    setError('');

    if (!user || !pass) {
      setError('Please enter both username and password');
      return;
    }

    const foundUser = usersDb.find(u => u.user === user && u.pass === pass);
    if (!foundUser) {
      setError('Invalid username or password');
      return;
    }

    const permission = authUsersDb.find(a => a.id === foundUser.id);
    if (!permission) {
      setError('User does not have required permissions');
      return;
    }

    onAuthorize(foundUser);
    resetAndClose();
  };

  const resetAndClose = () => {
    setUser('');
    setPass('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-8 bg-amber-50/50 border-b border-amber-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{title}</h2>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Permission Required</p>
              </div>
            </div>

          </div>

          <div className="p-8 space-y-6">
            <p className="text-center text-slate-400 text-[11px] font-bold uppercase tracking-wider leading-relaxed px-4">
              {message}
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="Username"
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-amber-300 transition-all shadow-inner"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Password"
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-amber-300 transition-all shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100"
                  >
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-8 pt-0 flex gap-3">
            <button
              onClick={resetAndClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAuth}
              className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={3} /> Authorize
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthorizerModal;
