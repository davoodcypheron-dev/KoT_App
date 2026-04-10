import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Printer, Wallet, MousePointer2, Clock,
  CheckCircle2, FileText, Ban, Bike, ShoppingCart, Armchair,
  ChevronRight, ArrowLeft, LayoutGrid, List, X, RefreshCw, User, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import SettlementModal from '../components/modals/SettlementModal';
import PrintBillModal from '../components/modals/PrintBillModal';
import { customersDb, tablesDb, floorsDb, deliveryAgentsDb } from '../data/mockDb';
import { getAllFromStore, saveToStore, ORDERS_STORE } from '../data/idb';

const OrderDetailsModal = ({ order, onClose, onSelect, onSettle, onPrint, config }) => {
  if (!order) return null;
  const customer = customersDb.find(c => c.id === order.customerId);
  const customerName = customer?.name || 'Walk-in Customer';
  const phoneNumber = customer?.mobile || '---';
  const agent = deliveryAgentsDb.find(a => a.id === order.deliveryAgentId);
  const uStatus = (order.status || 'RUNNING').toUpperCase();
  const isRunning = uStatus === 'RUNNING' || uStatus === 'MERGED' || uStatus === 'ACTIVE';
  const isSaved = uStatus === 'SAVED' || uStatus === 'BILLED';

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
        className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Information</span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none mt-1">Order #{order.latestKotNo}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 mb-8">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-left">Delivery Agent</span>
            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase">{agent?.name || 'Unassigned'}</span>
          </div>
          {agent?.mobile && (
            <div className="flex justify-between items-center border-b border-slate-50 pb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-left">Agent Contact</span>
              <span className="text-[11px] font-bold text-slate-500">{agent.mobile}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-left">Customer</span>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-black text-slate-800 leading-none">{customerName}</span>
              <span className="text-[10px] font-bold text-slate-400">{phoneNumber}</span>
            </div>
          </div>
          {order.invoiceNo && (
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-left">Invoice No</span>
              <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{order.invoiceNo}</span>
            </div>
          )}
          <div className="flex justify-between py-2 items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-left">Total Bill</span>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{config.currencySymbol}{(order.grandTotal || order.subTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { onPrint(order); onClose(); }}
            className="flex flex-col items-center justify-center gap-2 py-5 bg-slate-100 rounded-3xl text-slate-600 hover:bg-slate-200 transition-all font-black text-[9px] uppercase tracking-widest active:scale-95"
          >
            <Printer size={20} /> Print
          </button>
          {(isRunning || isSaved) && (
            <button
              onClick={() => { onSelect(order); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 py-5 bg-slate-800 rounded-3xl text-white hover:bg-slate-900 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95"
            >
              <MousePointer2 size={20} /> Select
            </button>
          )}
          {(isRunning || isSaved) && (
            <button
              onClick={() => { onSettle(order); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 py-5 bg-blue-600 rounded-3xl text-white hover:bg-blue-700 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95"
            >
              <Wallet size={20} /> Settle
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { notify, setSelectedTable, config } = useApp();
  const [filter, setFilter] = useState('ALL AGENTS');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [showSettleModal, setShowSettleModal] = useState(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const data = await getAllFromStore(ORDERS_STORE);
        // Only delivery orders
        const deliveryOrders = (data || []).filter(o => o.type === 'DE');
        if (isMounted) setOrders(deliveryOrders);
      } catch (err) { }
    };
    fetchOrders();
    return () => { isMounted = false; };
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();
    return orders.filter(order => {
      // Agent filter logic
      if (filter !== 'ALL AGENTS') {
        const agent = deliveryAgentsDb.find(a => a.id === order.deliveryAgentId);
        if (agent?.name !== filter) return false;
      }

      if (!term) return true;
      const customer = customersDb.find(c => c.id === order.customerId)?.name || '';
      const safeKot = order.latestKotNo != null ? String(order.latestKotNo).toLowerCase() : '';
      const safeInv = order.invoiceNo ? String(order.invoiceNo).toLowerCase() : '';

      return (
        safeKot.includes(term) ||
        safeInv.includes(term) ||
        customer.toLowerCase().includes(term)
      );
    });
  }, [orders, search, filter]);

  const topTotal = useMemo(() => {
    return filteredOrders
      .filter(o => {
        const status = (o.status || 'RUNNING').toUpperCase();
        return status !== 'CANCELLED';
      })
      .reduce((acc, curr) => acc + (curr.grandTotal || curr.subTotal || 0), 0);
  }, [filteredOrders]);

  const sections = [
    { title: 'New Delivery', status: 'RUNNING', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { title: 'Out For Delivery', status: 'SAVED', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { title: 'Delivered', status: 'SETTLED', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Cancelled Delivery', status: 'CANCELLED', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
  ];

  const handleSelectOrder = (order) => {
    const table = tablesDb.find(t => t.id === order.tableId) || { id: null, type: order.type };
    setSelectedTable(table, 1, order.id);
    navigate('/kot');
  };

  const handleSettleOrder = (order) => {
    const table = tablesDb.find(t => t.id === order.tableId) || { id: null, type: order.type };
    setShowSettleModal({ ...order, tableObj: { ...table, orderId: order.id } });
  };

  const OrderTile = ({ order }) => {
    const uStatus = (order.status || 'RUNNING').toUpperCase();
    const isSaved = uStatus === 'SAVED' || uStatus === 'BILLED';
    const isRunning = uStatus === 'RUNNING' || uStatus === 'MERGED' || uStatus === 'ACTIVE';
    const isSettled = uStatus === 'SETTLED';
    const isCancelled = uStatus === 'CANCELLED';

    const customer = customersDb.find(c => c.id === order.customerId);
    const agent = deliveryAgentsDb.find(a => a.id === order.deliveryAgentId);

    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => { !isCancelled && setShowDetails(order) }}
        className={`relative group rounded-2xl border-2 p-1.5 flex flex-col items-center justify-center gap-1 transition-all shadow-sm aspect-square ${isRunning ? 'bg-amber-50 border-amber-200 hover:border-amber-400' :
          isSaved ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' :
            isSettled ? 'bg-blue-50 border-blue-200 hover:border-blue-400' :
              'bg-rose-50 border-rose-200 hover:border-rose-400'
          }`}
      >
        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-auto">#{order.latestKotNo || '0'}</div>

        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shadow-sm ${isRunning ? 'bg-amber-100 text-amber-600' :
          isSaved ? 'bg-emerald-100 text-emerald-600' :
            isSettled ? 'bg-blue-100 text-blue-600' :
              'bg-rose-100 text-rose-600'
          }`}>
          <Truck size={16} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden w-full gap-0.5 mt-1 px-1">
          <span className="text-[11px] font-black text-slate-800 line-clamp-1 leading-none">{customer?.name || 'Guest'}</span>
          <span className="text-[9px] mt-1 font-black text-blue-600 bg-white/60 px-2 py-0.5 rounded-full border border-blue-50 shadow-sm truncate w-full text-center">
            {agent?.name ? agent.name.toUpperCase() : 'UN ASSIGNED'}
          </span>
        </div>

        <div className="mt-auto pt-1.5 border-t border-slate-200/40 w-full text-center">
          <span className="text-[12px] font-black text-slate-800 tracking-tighter font-mono">{config.currencySymbol}{(order.grandTotal || order.subTotal || 0).toFixed(2)}</span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden p-2">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-3 shrink-0 px-2 pt-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Delivery Management</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FFD93D]" /> NEW</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#6BCB77]" /> ASSIGNED</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#4D96FF]" /> DELIVERED</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" /> FAILED</div>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex items-end justify-between mb-3 gap-4 shrink-0 px-2">
        {/* Agent Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Delivery Person</label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 w-48 bg-white border border-slate-200 rounded-xl pl-9 pr-4 text-[11px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="ALL AGENTS">All Persons</option>
              {deliveryAgentsDb.map(agent => (
                <option key={agent.id} value={agent.name}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Quick Search</label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search Orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Total Delivery Value (Moved from Header) */}
        <div className="flex items-center gap-4 px-12 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Value</span>
            <span className="text-base font-black text-emerald-600 mt-0.5 font-mono">
              {config.currencySymbol}{topTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
          title="Refresh Data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex-1 flex gap-3 p-3 overflow-x-auto custom-scrollbar h-full min-h-0 bg-[#fffcf5]">
        {sections.map(section => {
          const sectionOrders = filteredOrders.filter(o => {
            const status = (o.status || 'RUNNING').toUpperCase();
            if (section.status === 'RUNNING') return status === 'RUNNING' || status === 'MERGED' || status === 'ACTIVE';
            if (section.status === 'SAVED') return status === 'SAVED' || status === 'BILLED';
            return status === section.status;
          });

          const sectionTotal = sectionOrders.reduce((acc, curr) => acc + (curr.grandTotal || curr.subTotal || 0), 0);

          return (
            <div key={section.status} className="flex-1 min-w-[300px] max-w-[400px] flex flex-col h-full bg-white/40 backdrop-blur-md border border-slate-200/60 rounded-[3rem] shadow-sm overflow-hidden border-b-4 border-b-slate-100 transition-all">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-1 rounded-full ${section.color.replace('text-', 'bg-')}`} />
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${section.color}`}>{section.title}</h2>
                </div>
                <div className={`px-2.5 py-1 rounded-xl font-black text-[10px] border ${section.bg} ${section.color} ${section.border} shadow-sm`}>
                  {sectionOrders.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {sectionOrders.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 pb-8">
                    {sectionOrders.map(order => (
                      <OrderTile key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center grayscale opacity-20 gap-3 py-12">
                    <Truck size={32} className={section.color} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Queue Empty</span>
                  </div>
                )}
              </div>

              {/* Section Footer with Total */}
              <div className="px-6 py-4 bg-white/80 border-t border-slate-100 shrink-0 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section Total</span>
                <span className={`text-[15px] font-black ${section.color} font-mono`}>
                  {config.currencySymbol}{sectionTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showDetails && (
          <OrderDetailsModal
            order={showDetails}
            onClose={() => setShowDetails(null)}
            onSelect={handleSelectOrder}
            onSettle={handleSettleOrder}
            onPrint={(order) => { setPrintOrder(order); setShowPrintConfirm(true); }}
            config={config}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettleModal && (
          <SettlementModal
            type={(showSettleModal.status?.toLowerCase() === 'running' || showSettleModal.status?.toLowerCase() === 'merged') ? 'save' : 'settle'}
            table={showSettleModal.tableObj}
            total={(showSettleModal.grandTotal || showSettleModal.subTotal || 0).toFixed(2)}
            onClose={() => setShowSettleModal(null)}
            orderType={showSettleModal.type}
            onProcess={async (msg, paymentData) => {
              try {
                const activeOrder = showSettleModal;
                const isNC = paymentData?.method === 'NC';
                const settlementStatus = (activeOrder.status || '').toUpperCase();
                const settlementType = settlementStatus === 'RUNNING' || settlementStatus === 'MERGED' || settlementStatus === 'ACTIVE' ? 'save' : 'settle';

                activeOrder.status = (settlementType === 'save' && !isNC) ? 'billed' : 'settled';
                const prefix = isNC ? 'NC-' : 'INV-';
                const timestamp = Math.floor(Date.now() / 1000).toString().substring(4);

                if (settlementType === 'save' && !isNC) {
                  activeOrder.invoiceNo = activeOrder.invoiceNo || prefix + timestamp;
                  activeOrder.billTime = activeOrder.billTime || new Date().toISOString();
                } else {
                  activeOrder.invoiceNo = activeOrder.invoiceNo || prefix + timestamp;
                  activeOrder.billTime = activeOrder.billTime || new Date().toISOString();
                  activeOrder.settleTime = new Date().toISOString();
                  activeOrder.payType = isNC ? 'NC' : (paymentData ? (paymentData.isMulti ? 'MULTI' : paymentData.method) : null);
                  if (isNC) {
                    activeOrder.discount = (activeOrder.subTotal || 0) + (activeOrder.taxes || 0);
                    activeOrder.grandTotal = 0;
                  }
                }

                await saveToStore(ORDERS_STORE, activeOrder);
                notify(msg, 'success');
                setShowSettleModal(null);

                // Refresh local state to reflect DB update
                const allData = await getAllFromStore(ORDERS_STORE);
                const deliveryOrders = (allData || []).filter(o => o.type === 'DE');
                setOrders(deliveryOrders);

                if (settlementType === 'settle' || isNC) setShowPrintConfirm(true);
              } catch (e) { console.error(e); notify("Transaction Fail", "error"); }
            }}
          />
        )}
      </AnimatePresence>

      <PrintBillModal
        isOpen={showPrintConfirm}
        title={printOrder?.status?.toUpperCase() === 'RUNNING' || printOrder?.status?.toUpperCase() === 'MERGED' ? "Print KOT" : "Print Receipt"}
        message={printOrder?.status?.toUpperCase() === 'RUNNING' || printOrder?.status?.toUpperCase() === 'MERGED' ? "Would you like to re-print the KOT?" : "Would you like to print the finalized receipt?"}
        onConfirm={() => { notify(`Printing Receipt...`, 'info'); setShowPrintConfirm(false); }}
        onCancel={() => setShowPrintConfirm(false)}
      />
    </div>
  );
};

export default DeliveryDashboard;
