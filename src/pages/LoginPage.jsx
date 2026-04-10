import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { usersDb } from '../data/mockDb';
import { Lock, User, KeyRound, ChevronRight, AlertCircle } from 'lucide-react';
import { clearAllData } from '../data/idb';
import { useEffect } from 'react';

const LoginPage = () => {
  const { config, setConfig, notify } = useApp();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(usersDb[0]?.id || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const resetData = async () => {
       try {
          await clearAllData();
          console.log("IndexedDB cleared on Login load.");
       } catch (e) {
          console.error("Failed to clear IndexedDB", e);
       }
    };
    resetData();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const user = usersDb.find(u => u.id === selectedUser);
    if (!user) {
      setError('Invalid user selected');
      return;
    }

    if (user.pass === password) {
      // Success
      setConfig(prev => ({ ...prev, activeUserId: user.id }));
      notify(`Welcome back, ${user.user}!`, 'success');
      navigate('/tables'); // default redirect
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
      <div className="flex-1 flex flex-col bg-[#f0f4f7] items-center justify-center font-sans h-screen">
         <div className="bg-white p-8 rounded-[1rem] shadow-sm border border-slate-300 w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
               <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-200 shadow-sm">
                  <Lock size={28} />
               </div>
               <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest">System Login</h1>
               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{config.restaurantName || "KoT System"}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                     <User size={12} /> Select User
                  </label>
                  <select
                     value={selectedUser}
                     onChange={(e) => setSelectedUser(e.target.value)}
                     className="w-full h-11 border border-slate-300 rounded-sm px-4 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50 transition-all shadow-inner"
                  >
                     {usersDb.map(u => (
                        <option key={u.id} value={u.id}>{u.user} ({u.role})</option>
                     ))}
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                     <KeyRound size={12} /> Password PIN
                  </label>
                  <input
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••"
                     className="w-full h-11 border border-slate-300 rounded-sm px-4 text-lg font-black text-slate-700 outline-none focus:border-blue-500 bg-slate-50 transition-all text-center tracking-[0.5em] shadow-inner"
                     autoFocus
                  />
               </div>

               {error && (
                  <div className="bg-rose-50 text-rose-600 p-2.5 rounded-sm border border-rose-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm">
                     <AlertCircle size={14} /> {error}
                  </div>
               )}

               <button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 mt-4"
               >
                  Authorize <ChevronRight size={14} />
               </button>
            </form>
         </div>
         <div className="absolute bottom-6 opacity-30 text-[9px] font-black uppercase tracking-widest text-slate-500">
            Powered by Antigravity v2.4
         </div>
      </div>
  );
};

export default LoginPage;
