import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { usersDb } from '../data/mockDb';
import { Settings, Save, Truck, RotateCcw, Shield, User, Search, Percent, Database, Users, Table as TableIcon, Coffee, Activity, CreditCard, Link, Tag, Layers, ChefHat, UserCog } from 'lucide-react';
import MasterNavPanel from '../components/MasterNavPanel';
import { initAppDb } from '../data/dbInitializer';
import EntityManagerModal from '../components/modals/EntityManagerModal';

const ConfigPage = () => {
  const { config, setConfig, resetConfig, notify } = useApp();
  const navigate = useNavigate();
  const [activeEntityModal, setActiveEntityModal] = React.useState(null);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      resetConfig();
      notify("Settings reset to defaults", "info");
    }
  };

  const handleFactoryReset = async () => {
    if (window.confirm("CRITICAL WARNING: This will PERMANENTLY WIPE all database data (Orders, Transactions, Edits) and reset everything back to factory meta_data.js! Type OK to confirm.")) {
      const userOk = prompt("Type 'CONFIRM' to factory reset data:");
      if (userOk === 'CONFIRM') {
        notify("Initiating Factory Reset... Please wait", "info");
        await initAppDb(true);
        window.location.href = '/login';
      } else {
        notify("Factory reset aborted.", "info");
      }
    }
  };

  const updateField = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f0f4f7] overflow-hidden font-sans h-screen">
      <MasterNavPanel />

      <div className="flex-1 overflow-hidden p-2 flex gap-3">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col gap-3 no-scrollbar">

          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-3">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 flex items-center gap-2 pb-2 mb-1">
              <Truck size={14} /> Basic Operations
            </h2>
            <div className="space-y-1">
              {/* 1. Branding */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Restaurant Branding *</label>
                <input
                  type="text"
                  value={config.restaurantName}
                  onChange={(e) => updateField('restaurantName', e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={config.taxRate}
                    onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full h-8 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Currency</label>
                  <input
                    type="text"
                    value={config.currencySymbol}
                    onChange={(e) => updateField('currencySymbol', e.target.value)}
                    className="w-full h-8 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-600">Default Order Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['DI', 'TA', 'DE'].map(type => {
                    const isActive = config.defaultKotType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => updateField('defaultKotType', type)}
                        className={`py-2 rounded-sm border text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-white'}`}
                      >
                        {type === 'DI' ? 'Dine-In' : type === 'TA' ? 'TakeAway' : 'Delivery'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-3">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 flex items-center gap-2 pb-2 mb-3">
              <Percent size={14} /> Discount Controls
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Staff Limit (%)</label>
                  <input
                    type="number"
                    value={config.cashierDiscountLimit}
                    onChange={(e) => updateField('cashierDiscountLimit', parseInt(e.target.value) || 0)}
                    className="w-full h-8 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Auth Limit (%)</label>
                  <input
                    type="number"
                    value={config.authDiscountLimit}
                    onChange={(e) => updateField('authDiscountLimit', parseInt(e.target.value) || 0)}
                    className="w-full h-8 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">Auth Only Mode</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Hide regular discount panel</p>
                </div>
                <button
                  onClick={() => updateField('authDisocuntOnly', !config.authDisocuntOnly)}
                  className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${config.authDisocuntOnly ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${config.authDisocuntOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-3">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 flex items-center gap-2 pb-2 mb-3">
              <User size={14} /> Identity & Search
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700 block">Quick Search Mode</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Auto-focus search on load</p>
                </div>
                <button
                  onClick={() => updateField('openSearch', !config.openSearch)}
                  className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${config.openSearch ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${config.openSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700 block">Enable Post-Order Type</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Change Order Type on Save/Settle</p>
                </div>
                <button
                  onClick={() => updateField('enablePostOrderType', !config.enablePostOrderType)}
                  className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${config.enablePostOrderType ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${config.enablePostOrderType ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons pinned to bottom of right column */}
          <div className=" bottom-0 left-0 right-0 bg-white border border-slate-300 rounded-sm shadow-sm p-2 flex justify-between items-center z-10">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Changes auto-save
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="bg-[#fd7c7c] hover:bg-[#f35959] text-white h-9 px-6 rounded-md flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                onClick={() => {
                  notify("Configurations locked & stored.", "success");
                  navigate('/tables');
                }}
                className="bg-[#90e1a4] hover:bg-[#78cc8d] text-emerald-900 h-9 px-6 rounded-md flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
              >
                <Save size={14} /> Apply
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-3  no-scrollbar relative pb-16">
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-3 flex-1 flex flex-col">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 flex items-center gap-2 pb-2 mb-3">
              <Shield size={14} /> Policy Enforcement
            </h2>
            <div className="space-y-3 flex-1">
              {[
                { id: 'paxMandatory', label: 'PAX Mandatory', desc: 'Force guest count entry' },
                { id: 'waiterMandatory', label: 'Waiter Mandatory', desc: 'Force waiter selection' },
                { id: 'settleByLedger', label: 'Settle By Ledgers', desc: 'Force Users to Settle By Select Ledgers' }
              ].map(policy => (
                <div key={policy.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">{policy.label}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{policy.desc}</p>
                  </div>
                  <button
                    onClick={() => updateField(policy.id, !config[policy.id])}
                    className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${config[policy.id] ? 'bg-blue-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${config[policy.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-3">
            <h2 className="text-[10px] font-black text-rose-600 uppercase tracking-widest border-b border-rose-100 flex items-center gap-2 pb-2 mb-3">
              <Database size={14} /> Database Management
            </h2>
            <div className="space-y-3">
              <p className="text-[10px] font-medium text-slate-500 italic pb-2">
                Manage internal master tables or entirely wipe the local IndexedDB database to start fresh from factory mock data.
              </p>
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
                {[
                  { key: 'USERS', label: 'Staff & Users', icon: <Users size={12} /> },
                  { key: 'WAITERS', label: 'Waiters', icon: <ChefHat size={12} /> },
                  { key: 'DELIVERY_AGENTS', label: 'Delivery Agents', icon: <Truck size={12} /> },
                  { key: 'AUTH_USERS', label: 'Auth Configs', icon: <UserCog size={12} /> },
                  { key: 'TABLES', label: 'Tables', icon: <TableIcon size={12} /> },
                  { key: 'FLOORS', label: 'Floors', icon: <Layers size={12} /> },
                  { key: 'GROUPS', label: 'Menu Groups', icon: <Activity size={12} /> },
                  { key: 'ITEMS', label: 'Menu Items', icon: <Coffee size={12} /> },
                  { key: 'PAYMENT_METHODS', label: 'Pay Methods', icon: <CreditCard size={12} /> },
                  { key: 'MULTI_PAY_TYPES', label: 'Multi Pay', icon: <Link size={12} /> },
                  { key: 'LEDGERS', label: 'Ledgers', icon: <Shield size={12} /> },
                  { key: 'COOKING_INSTRUCTIONS', label: 'Cooking Instr.', icon: <Tag size={12} /> },
                  { key: 'UNITS', label: 'Units', icon: <Percent size={12} /> }
                ].map(act => (
                  <button
                    key={act.key}
                    onClick={() => setActiveEntityModal(act.key)}
                    className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {act.icon} {act.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleFactoryReset}
                className="w-full relative group overflow-hidden bg-rose-50 border border-rose-200 hover:border-rose-400 text-rose-700 h-10 rounded-sm flex items-center justify-center font-black text-[11px] uppercase tracking-widest transition-all"
              >
                <div className="absolute inset-0 w-0 bg-rose-600 transition-all duration-[400ms] ease-out group-hover:w-full z-0 opacity-10"></div>
                <span className="relative z-10 flex items-center gap-2"><RotateCcw size={14} /> Factory Reset Database</span>
              </button>
            </div>
          </div>

        </div>
      </div>
      <EntityManagerModal
        isOpen={!!activeEntityModal}
        entityType={activeEntityModal}
        onClose={() => setActiveEntityModal(null)}
      />
    </div>
  );
};

export default ConfigPage;
