
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { tablesDb, floorsDb } from '../data/mockDb';
import { getActiveOrdersByType, saveToStore, ORDERS_STORE } from '../data/idb';
import {
  ArrowLeft, Shuffle, CheckCircle2, ChevronRight,
  Clock, Hash, AlertTriangle, Layers, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TableChangePage = () => {
  const navigate = useNavigate();
  const { notify } = useApp();

  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const floors = floorsDb;
  const [liveOrders, setLiveOrders] = useState([]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      const diOrders = await getActiveOrdersByType('DI');
      if (isMounted) setLiveOrders(diOrders || []);
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Group tables dynamically based on live orders
  const runningTables = useMemo(() =>
    tablesDb.filter(t => liveOrders.some(o => (o.tableId === t.id && o.status.toLowerCase() === 'running'))),
    [liveOrders]);

  const availableTables = useMemo(() =>
    tablesDb.filter(t => !liveOrders.some(o => o.tableId === t.id)),
    [liveOrders]);

  const handleSourceSelect = (table) => {
    setSelectedSource(table);
    setSelectedDest(null);
  };

  const handleDestSelect = (table) => {
    if (!selectedSource) return;
    setSelectedDest(table);
    setShowConfirm(true);
  };

  const confirmTableChange = async () => {
    try {
      const activeOrder = liveOrders.find(o => o.tableId === selectedSource.id);
      if (activeOrder) {
        activeOrder.tableId = selectedDest.id;
        await saveToStore(ORDERS_STORE, activeOrder);
        notify(`Table ${selectedSource.id} successfully moved to ${selectedDest.id}`, 'success');
        setShowConfirm(false);
        setSelectedSource(null);
        setSelectedDest(null);
        navigate('/tables');
      } else {
        notify('No active order found on source table!', 'error');
      }
    } catch (e) {
      console.error(e);
      notify('Failed to move table', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Table Change</h1>
        </div>

      </div>

      {/* Main Panels */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel: Running Orders */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">01</span>
              Select Running Orders
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {runningTables.map(table => {
                const isActive = selectedSource?.id === table.id;
                return (
                  <motion.button
                    key={table.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSourceSelect(table)}
                    className={`relative p-5 rounded-[2rem] border-2 transition-all text-left flex flex-col justify-between h-36 ${isActive
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xl'
                      : 'bg-sky-100 text-sky-800 border-sky-200'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-sky-100' : 'text-sky-600'}`}>
                        {floorsDb.find(f => f.id === table.floor)?.name}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-white/50 text-sky-600'}`}>
                        <Shuffle size={14} />
                      </div>
                    </div>

                    <div className="mt-1">
                      <h3 className="text-2xl font-black leading-none">{table.id}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-white/20' : 'bg-sky-200 text-sky-900 border border-sky-300'}`}>
                          {/* {table.status} */}
                          {liveOrders.find(o => o.tableId === table.id)?.status || 'vacant'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <span className="text-xs font-black">KOT NO: {liveOrders.find(o => o.tableId === table.id)?.latestKotNo || '0'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Clock size={12} strokeWidth={3} />
                        <span className="text-[10px] font-black">{liveOrders.find(o => o.tableId === table.id)?.createTime ? new Date(liveOrders.find(o => o.tableId === table.id).createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Available Tables */}
        <div className={`w-1/2 flex flex-col transition-opacity duration-300 ${!selectedSource ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">02</span>
              Select Available Tables
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
            <div className="space-y-8">
              {floors.map(floor => (
                <div key={floor.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{floor.name}</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {availableTables.filter(t => t.floor === floor.id).map(table => (
                      <motion.button
                        key={table.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDestSelect(table)}
                        className="p-4 rounded-[1.5rem] bg-white border-2 border-slate-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center flex flex-col items-center justify-center h-28 group"
                      >
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">{floor.name}</span>
                        <h3 className="text-xl font-black text-slate-700 mt-1 uppercase group-hover:text-emerald-600">{table.id}</h3>
                        <div className="mt-3 w-6 h-1 bg-slate-100 rounded-full group-hover:bg-emerald-200 transition-all" />
                      </motion.button>
                    ))}
                    {availableTables.filter(t => t.floor === floor).length === 0 && (
                      <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-100 rounded-[1.5rem]">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No available tables</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && selectedSource && selectedDest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-lg w-full relative overflow-hidden"
            >
              {/* Decorative background circle */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full opacity-50" />

              <div className="relative z-10 text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200 rotate-6">
                  <Shuffle size={48} className="text-white -rotate-6" />
                </div>

                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Confirm Table Change</h2>
                <p className="text-slate-500 font-bold mb-10 leading-relaxed uppercase text-[11px] tracking-widest">
                  You are moving all active KOTs and pending amounts
                </p>

                <div className="flex items-center justify-center gap-8 mb-12">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xl mb-2">{selectedSource.id}</div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</span>
                  </div>

                  <div className="flex flex-col items-center justify-center h-16">
                    <ChevronRight size={32} className="text-blue-400 animate-pulse" />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl mb-2 shadow-inner ring-4 ring-emerald-500/10 transition-all">{selectedDest.id}</div>
                    <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest font-black">Destination</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowConfirm(false); setSelectedDest(null); }}
                    className="flex-1 h-16 rounded-2xl border-2 border-slate-100 font-black text-slate-400 uppercase text-xs tracking-[0.2em] hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmTableChange}
                    className="flex-[2] h-16 rounded-2xl bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-100 active:scale-95 transition-all"
                  >
                    Confirm Move
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableChangePage;
