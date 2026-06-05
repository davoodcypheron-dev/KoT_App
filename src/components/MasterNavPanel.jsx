import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Plus, Link as LinkIcon, Package, Home } from 'lucide-react';

const MasterNavPanel = () => {
   const navigate = useNavigate();
   const location = useLocation();

   const navItems = [
      { path: '/configPage', title: 'System Config', icon: <Settings size={14} /> },
      { path: '/addon-master', title: 'Addon Master', icon: <Plus size={14} /> },
      { path: '/item-addon-master', title: 'Item Addon Master', icon: <LinkIcon size={14} /> },
      { path: '/product-choice-master', title: 'Choice & Combo Master', icon: <Package size={14} /> }
   ];

   return (
      <div className="flex bg-[#e1e9f0] px-3 py-1.5 border-b border-slate-300 items-center justify-between shadow-sm shrink-0">
         <div className="flex items-center gap-1">
            {navItems.map((item) => {
               const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();
               return (
                  <button
                     key={item.path}
                     onClick={() => navigate(item.path)}
                     className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/40 hover:bg-white text-slate-600 hover:text-blue-600 border border-transparent hover:border-slate-300'
                        }`}
                  >
                     <span className={isActive ? 'text-white' : 'text-blue-500'}>{item.icon}</span>
                     {item.title}
                  </button>
               );
            })}
         </div>

         <div className="flex items-center gap-2">
            <button
               onClick={() => navigate('/tables')}
               className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 flex items-center gap-1.5 text-[10px] font-black uppercase transition-all active:scale-95 shadow-sm"
            >
               <Home size={14} className="text-slate-500" /> Back to POS
            </button>
         </div>
      </div>
   );
};

export default MasterNavPanel;
