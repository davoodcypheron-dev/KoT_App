import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Printer, Wallet, MousePointer2, Clock, RefreshCw,
  CheckCircle2, FileText, Ban, Bike, ShoppingCart, Armchair,
  ChevronRight, ArrowLeft, LayoutGrid, List, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import SettlementModal from '../components/modals/SettlementModal';
import PrintBillModal from '../components/modals/PrintBillModal';
import { customersDb, tablesDb, floorsDb } from '../data/mockDb';
import { getAllFromStore, saveToStore, ORDERS_STORE } from '../data/idb';

import OrderDetailsModal from '../components/modals/OrderDetailsModal';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { notify, setSelectedTable, config } = useApp();
  const [filter, setFilter] = useState('ALL ORDERS');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [showSettleModal, setShowSettleModal] = useState(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [isRightColExpanded, setIsRightColExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const data = await getAllFromStore(ORDERS_STORE);
        if (isMounted) setOrders(data || []);
      } catch (err) { }
    };
    fetchOrders();
    // Removed auto-refresh interval as requested
    return () => { isMounted = false; };
  }, []);

  const filteredOrders = useMemo(() => {
    // Category filter
    let baseOrders = orders;
    if (filter === 'DINE IN') baseOrders = orders.filter(o => o.type === 'DI');
    else if (filter === 'TAKE AWAY') baseOrders = orders.filter(o => o.type === 'TA');
    else if (filter === 'DELIVERY') baseOrders = orders.filter(o => o.type === 'DE');
    else if (filter === 'CANCELLED') baseOrders = orders.filter(o => (o.status || '').toUpperCase() === 'CANCELLED');
    else if (filter === 'BILL GENERATED') baseOrders = orders.filter(o => !!o.invoiceNo);

    const term = search.toLowerCase().trim();
    if (!term) return baseOrders;

    return baseOrders.filter(order => {
      const customer = customersDb.find(c => c.id === order.customerId)?.name || '';
      const table = order.tableId ? `${floorsDb.find(f => f.id === tablesDb.find(t => t.id === order.tableId)?.floor)?.name || ''}/${order.tableId}` : '';
      const safeKot = order.latestKotNo != null ? String(order.latestKotNo).toLowerCase() : '';
      const safeInv = order.invoiceNo ? String(order.invoiceNo).toLowerCase() : '';

      return (
        safeKot.includes(term) ||
        safeInv.includes(term) ||
        table.toLowerCase().includes(term) ||
        customer.toLowerCase().includes(term) ||
        (order.type || '').toLowerCase().includes(term)
      );
    });
  }, [orders, search, filter]);

  const runningOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const status = (o.status || 'RUNNING').toUpperCase();
      return status === 'RUNNING' || status === 'MERGED' || status === 'ACTIVE';
    });
  }, [filteredOrders]);

  const savedOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const status = (o.status || 'RUNNING').toUpperCase();
      return status === 'SAVED' || status === 'BILLED';
    });
  }, [filteredOrders]);

  const settledCancelledOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const status = (o.status || 'RUNNING').toUpperCase();
      return status === 'SETTLED' || status === 'CANCELLED';
    });
  }, [filteredOrders]);

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

    const typeIcon = order.type === 'DI' ? <Armchair size={14} /> : order.type === 'TA' ? <ShoppingCart size={14} /> : <Bike size={14} />;
    const floorName = order.tableId ? (floorsDb.find(f => f.id === tablesDb.find(t => t.id === order.tableId)?.floor)?.name || '') : '';
    const tableName = order.tableId ? `${floorName} / T-${order.tableId}` : (order.type === 'TA' ? 'Take Away' : 'Home Delivery');

    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => !isCancelled && setShowDetails(order)}
        className={`w-[140px] aspect-square relative group rounded-2xl border-2 p-1 flex flex-col items-center justify-center gap-1 transition-all shadow-sm ${isCancelled ? 'cursor-default' : 'cursor-pointer'} ${isRunning ? 'bg-amber-50 border-amber-200 hover:border-amber-400' :
          isSaved ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' :
            isSettled ? 'bg-blue-50 border-blue-200 hover:border-blue-400' :
              'bg-rose-50 border-rose-200 hover:border-rose-400'
          }`}
      >
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-auto">#{order.latestKotNo || '0'}</div>

        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shadow-sm ${isRunning ? 'bg-amber-100 text-amber-600' :
          isSaved ? 'bg-emerald-100 text-emerald-600' :
            isSettled ? 'bg-blue-100 text-blue-600' :
              'bg-rose-100 text-rose-600'
          }`}>
          {typeIcon}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden w-full gap-0.5">
          <span className="text-[11px] font-black text-slate-800 line-clamp-1 text-center truncate w-full">{tableName}</span>
          {order.invoiceNo && (
            <span className="text-[8px] font-black text-blue-500 truncate w-full text-center px-1">{order.invoiceNo}</span>
          )}
        </div>

        <div className="mt-auto pt-1 border-t border-slate-200/40 w-full text-center">
          <span className="text-[12px] font-black text-slate-800 tracking-tighter">{config.currencySymbol}{(order.grandTotal || order.subTotal || 0).toFixed(2)}</span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden p-2">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-3 shrink-0 px-2 pt-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Orders List</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FFD93D]" /> RUNNING</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#6BCB77]" /> SAVED</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#4D96FF]" /> SETTLED</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF9999]" /> MERGED</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" /> CANCELLED</div>
          </div>
        </div>
      </div>

      {/* Filters & Action Area */}
      <div className="flex items-center justify-between mb-3 gap-4 shrink-0 px-2">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {['ALL ORDERS', 'DINE IN', 'TAKE AWAY', 'DELIVERY', 'BILL GENERATED', 'CANCELLED'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setFilter(t);
                if (t === 'CANCELLED' || t === 'BILL GENERATED') {
                  setIsRightColExpanded(true);
                } else {
                  setIsRightColExpanded(false);
                }
              }}
              className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === t
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                } ${t === 'CANCELLED' && filter === t ? 'bg-rose-500' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-sm relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search Invoice/Table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => navigate('/delivery-summary')}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            <Bike size={18} /> Delivery Summary
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 p-3 h-full min-h-0 bg-[#fdf2f2]/50 overflow-hidden">
        {/* Running Orders Column */}
        <div className="flex-1 min-w-[300px] flex flex-col h-full bg-white/40 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-amber-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Running Orders</h2>
            </div>
            <div className="px-2.5 py-1 rounded-xl font-black text-[10px] border bg-amber-50 text-amber-600 border-amber-200 shadow-sm">
              {runningOrders.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {runningOrders.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-2 pb-12">
                {runningOrders.map(order => (
                  <OrderTile key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center grayscale opacity-30 gap-4 py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center bg-amber-50 text-amber-600">
                  <LayoutGrid size={32} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No running orders found</span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Orders Column */}
        <div className="flex-1 min-w-[300px] flex flex-col h-full bg-white/40 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Saved Orders</h2>
            </div>
            <div className="px-2.5 py-1 rounded-xl font-black text-[10px] border bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm">
              {savedOrders.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {savedOrders.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-2 pb-12">
                {savedOrders.map(order => (
                  <OrderTile key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center grayscale opacity-30 gap-4 py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <LayoutGrid size={32} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No saved orders found</span>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Settled / Cancelled Orders Column */}
        <div
          className={`h-full flex transition-all duration-300 ease-in-out ${
            isRightColExpanded
              ? 'w-full max-w-[550px] min-w-[380px]'
              : 'w-16 min-w-[4rem] max-w-[4rem]'
          }`}
        >
          {!isRightColExpanded ? (
            <button
              onClick={() => setIsRightColExpanded(true)}
              className="flex-1 flex flex-col items-center py-6 bg-white/45 hover:bg-white/60 border border-slate-200/60 rounded-[2.5rem] shadow-sm transition-all cursor-pointer select-none gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <ChevronRight className="rotate-180" size={18} />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  Settled / Cancelled Orders
                </span>
              </div>
              <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-xl font-black text-[10px] text-blue-600 shadow-sm">
                {settledCancelledOrders.length}
              </div>
            </button>
          ) : (
            <div className="flex-1 flex flex-col h-full bg-white/40 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsRightColExpanded(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    Settled / Cancelled
                  </h2>
                </div>
                <div className="px-2.5 py-1 rounded-xl font-black text-[10px] border bg-blue-50 text-blue-600 border-blue-200 shadow-sm">
                  {settledCancelledOrders.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {settledCancelledOrders.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-2 pb-12">
                    {settledCancelledOrders.map((order) => (
                      <OrderTile key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center grayscale opacity-30 gap-4 py-20 px-4 text-center">
                    <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center bg-blue-50 text-blue-600">
                      <LayoutGrid size={32} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      No orders found
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Popup */}
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

      {/* Settlement Logic */}
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
                const updatedOrders = await getAllFromStore(ORDERS_STORE);
                setOrders(updatedOrders);
                
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
        onConfirm={() => {
          notify(`Printing ${printOrder?.status?.toUpperCase() === 'RUNNING' ? 'KOT' : 'Receipt'}...`, 'info');
          setShowPrintConfirm(false);
        }}
        onCancel={() => setShowPrintConfirm(false)}
      />
    </div>
  );
};

export default OrderHistoryPage;
