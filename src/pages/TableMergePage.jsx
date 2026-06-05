
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

import {
  ArrowLeft, List, CheckCircle2, ChevronRight,
  Hash, ClipboardList, Layers, Save, X, AlertTriangle, Armchair, Clock, Shuffle, Plus, Merge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { tablesDb, itemsDb, floorsDb } from '../data/mockDb';
import { getActiveOrdersByType, getOrderItems, saveToStore, ORDERS_STORE, ORDER_ITEMS_STORE } from '../data/idb';

const TableMergePage = () => {
  const navigate = useNavigate();
  const { notify } = useApp();

  const [selectedTables, setSelectedTables] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [liveOrders, setLiveOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

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

  const runningTables = useMemo(() =>
    tablesDb.filter(t => liveOrders.some(o => (o.tableId === t.id && o.status.toLowerCase() === 'running'))),
    [liveOrders]);

  React.useEffect(() => {
    const fetchSelectedItems = async () => {
      let items = [];
      for (let selectedTableObj of selectedTables) {
        const activeOrder = liveOrders.find(o => o.tableId === selectedTableObj.id);
        if (activeOrder) {
          const tableItems = await getOrderItems(activeOrder.id);
          tableItems.forEach(oi => {
            const itemDetail = itemsDb.find(i => i.id === oi.itemId) || { name: 'Unknown Item' };
            let itemName = itemDetail.name;
            if (oi.isChoice && oi.variantId) {
              itemName += ` - ${oi.variantId}`;
            }

            items.push({
              ...oi,
              tableId: selectedTableObj.id,
              item: itemName,
              kotNo: activeOrder.latestKotNo,
              total: oi.price * oi.qty
            });
          });
        }
      }
      setSelectedItems(items);

    };
    fetchSelectedItems();
  }, [selectedTables, liveOrders]);

  const totalValue = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.total || 0), 0);
  }, [selectedItems]);

  const toggleTable = (table) => {
    setSelectedTables(prev =>
      prev.find(t => t.id === table.id)
        ? prev.filter(t => t.id !== table.id)
        : [...prev, table]
    );
  };

  const handleContinue = () => {
    if (selectedTables.length < 2) {
      notify('Select at least 2 tables to merge', 'error');
      return;
    }
    setShowConfirm(true);
  };

  const confirmMerge = async () => {
    if (selectedTables.length < 2) return;
    try {
      const targetTable = selectedTables[0].id;
      const targetOrder = liveOrders.find(o => o.tableId === targetTable);
      if (!targetOrder) throw new Error("Primary order missing");

      for (let i = 1; i < selectedTables.length; i++) {
        const sourceTable = selectedTables[i];
        const sourceOrder = liveOrders.find(o => o.tableId === sourceTable.id);
        if (!sourceOrder) continue;

        const sourceItems = await getOrderItems(sourceOrder.id);
        for (let item of sourceItems) {
          item.orderId = targetOrder.id; // Map to the master checkout instance
          await saveToStore(ORDER_ITEMS_STORE, item);
        }

        targetOrder.grandTotal = (targetOrder.grandTotal || 0) + (sourceOrder.grandTotal || 0);
        targetOrder.subTotal = (targetOrder.subTotal || 0) + (sourceOrder.subTotal || 0);
        targetOrder.taxes = (targetOrder.taxes || 0) + (sourceOrder.taxes || 0);

        sourceOrder.status = 'merged';
        await saveToStore(ORDERS_STORE, sourceOrder);
      }

      await saveToStore(ORDERS_STORE, targetOrder);

      notify(`Orders successfully merged into Table ${targetTable}`, 'success');
      setShowConfirm(false);
      setTimeout(() => navigate('/tables'), 500);
    } catch (e) {
      console.error(e);
      notify('Failed to merge tables', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">

          <h1 className="text-xl font-black text-slate-800 tracking-tight">

            Table Merge
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected</span>
            <span className="text-[12x] font-black text-blue-600 leading-none">{selectedTables.length} Tables</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
          <button
            disabled={selectedTables.length < 2}
            onClick={handleContinue}
            className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedTables.length >= 2
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Continue Merge
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Running Orders in Tile Grid */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">01</span>
              Select Running Orders
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {runningTables.map(table => {
                const isActive = selectedTables.find(t => t.id === table.id);
                return (
                  <motion.button
                    key={table.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTable(table)}
                    className={`relative p-5 rounded-[2rem] border-2 transition-all text-left flex flex-col justify-between h-38 ${isActive
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xl'
                      : 'bg-sky-100 text-sky-800 border-sky-200 hover:border-sky-300'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-sky-100' : 'text-sky-600'}`}>
                        {floorsDb.find(f => f.id === table.floor)?.name || table.floor}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-white text-sky-600 shadow-lg' : 'bg-white/50 text-sky-600'}`}>
                        {isActive ? <CheckCircle2 size={16} /> : <Merge size={14} />}
                      </div>
                    </div>

                    <div className="mt-0 text-center mb-2">
                      <h3 className="text-2xl font-black leading-none uppercase">{table.id}</h3>
                      <div className={`mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${isActive ? 'bg-white/20' : 'bg-sky-200 text-sky-900 border border-sky-300'}`}>
                        KOT NO: {liveOrders.find(o => o.tableId === table.id)?.latestKotNo || '0'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto p-3 border-t border-current border-opacity-10">
                      <div className="flex items-center gap-1 opacity-80">
                        <span className="text-[10px] font-black">₹{liveOrders.find(o => o.tableId === table.id)?.grandTotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-80">
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

        {/* Right Panel: Merge Preview */}
        <div className="w-[450px] flex flex-col bg-slate-50/50 overflow-hidden relative border-l border-slate-200">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">02</span>
              Merge Item Preview
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 text-slate-400">
                <Layers size={80} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-center">Select multiple tables <br /> to preview merged items</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {selectedItems.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={`${item.tableId}-${item.id}`}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-400 transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-wider">{item.tableId}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">KOT: {item.kotNo}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 uppercase leading-none mt-1">{item.item}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800 leading-none">₹{item.total.toFixed(2)}</p>
                      <p className="text-xs font-bold text-rose-400 mt-1 uppercase">Qty: {item.qty}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Area */}
          {selectedItems.length > 0 && (
            <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Combined Total</span>
                <span className="text-2xl font-black text-blue-600 font-mono">₹{totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full relative overflow-hidden text-center border border-slate-100"
            >
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 rotate-6">
                <Shuffle size={40} className="text-white -rotate-6" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Confirm Multi-Merge</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-8">All orders will be merged into the primary table</p>

              <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-100">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 border-dashed">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-blue-500/10">
                    {selectedTables[0]?.id}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-tighter">Primary Destination</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Final merged order location</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block w-full mb-1">Source Tables:</span>
                  {selectedTables.slice(1).map(t => (
                    <div key={t.id} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 flex items-center gap-2">
                      <Plus size={10} className="text-blue-500" /> Table {t.id}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-16 rounded-2xl border-2 border-slate-100 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={confirmMerge}
                  className="flex-[2] h-16 rounded-2xl bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-100 active:scale-95 transition-all"
                >
                  Confirm & Merge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableMergePage;
