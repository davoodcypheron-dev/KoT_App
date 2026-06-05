import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Printer, Wallet, Edit2,
  MousePointer2, Truck, Filter, XCircle,
  Clock, CheckCircle2, FileText, Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import SettlementModal from '../components/modals/SettlementModal';
import PrintBillModal from '../components/modals/PrintBillModal';

import { ordersDb, customersDb, tablesDb, floorsDb } from '../data/mockDb';
import { getAllFromStore, saveToStore, ORDERS_STORE } from '../data/idb';

const OrdersListPage = () => {
  const navigate = useNavigate();
  const { notify, setSelectedTable } = useApp();
  const [filter, setFilter] = useState('ALL ORDERS');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [showSettleModal, setShowSettleModal] = useState(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const data = await getAllFromStore(ORDERS_STORE);
        if (isMounted) setOrders(data || []);
      } catch (err) { }
    };
    fetchOrders();
    const invId = setInterval(fetchOrders, 2000);
    return () => { isMounted = false; clearInterval(invId); };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'SAVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'SETTLED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MERGED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-[#FFD93D]';
      case 'SAVED': return 'bg-[#6BCB77]';
      case 'SETTLED': return 'bg-[#4D96FF]';
      case 'MERGED': return 'bg-[#FF9999]';
      case 'CANCELLED': return 'bg-[#FF6B6B]';
      default: return 'bg-slate-400';
    }
  };

  const filteredOrders = orders.filter(order => {
    // Category filter
    let matchesFilter = true;
    if (filter === 'DINE IN') matchesFilter = order.type === 'DI';
    else if (filter === 'TAKE AWAY') matchesFilter = order.type === 'TA';
    else if (filter === 'DELIVERY') matchesFilter = order.type === 'DE';
    else if (filter === 'CANCELLED') matchesFilter = (order.status || '').toUpperCase() === 'CANCELLED';
    else if (filter === 'BILL GENERATED') matchesFilter = !!order.invoiceNo;

    if (!matchesFilter) return false;

    // Search filter
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return true;

    const customer = customersDb.find(c => c.id === order.customerId)?.name || '';
    const table = order.tableId ? `${floorsDb.find(f => f.id === tablesDb.find(t => t.id === order.tableId)?.floor)?.name || ''}/${order.tableId}` : '';

    const safeTotal = order.grandTotal || order.subTotal || 0;
    const safeKot = order.latestKotNo != null ? String(order.latestKotNo).toLowerCase() : '';
    const safeInv = order.invoiceNo ? String(order.invoiceNo).toLowerCase() : '';
    const safeTime = order.createTime ? new Date(order.createTime).toLocaleString().toLowerCase() : '';

    return (
      safeKot.includes(searchTerm) ||
      safeTime.includes(searchTerm) ||
      (order.type || '').toLowerCase().includes(searchTerm) ||
      safeInv.includes(searchTerm) ||
      table.toLowerCase().includes(searchTerm) ||
      customer.toLowerCase().includes(searchTerm) ||
      safeTotal.toString().toLowerCase().includes(searchTerm)
    );
  });

  const handleSelectOrder = (order) => {
    const table = tablesDb.find(t => t.id === order.tableId) || { id: null, type: order.type };
    setSelectedTable(table, 1, order.id);
    navigate('/kot');
  };

  const handleSettleOrder = (order) => {
    const table = tablesDb.find(t => t.id === order.tableId) || { id: null, type: order.type };
    setShowSettleModal({ ...order, tableObj: { ...table, orderId: order.id } });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-4">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6">
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
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {['ALL ORDERS', 'DINE IN', 'TAKE AWAY', 'DELIVERY', 'BILL GENERATED', 'CANCELLED'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === t
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-white hover:text-slate-700'
                } ${t === 'CANCELLED' && filter === t ? 'bg-rose-500' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Invoice/Table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        <button
          onClick={() => navigate('/delivery-report')}
          className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <Truck size={18} /> Delivery Summary
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#334155] text-white text-[10px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-slate-600">KOT NO</th>
              <th className="px-4 py-4 border-r border-slate-600">DATE & TIME</th>
              <th className="px-4 py-4 border-r border-slate-600 text-center">TYPE</th>
              <th className="px-4 py-4 border-r border-slate-600">INVOICE</th>
              <th className="px-4 py-4 border-r border-slate-600">FLOOR/TABLE</th>
              <th className="px-4 py-4 border-r border-slate-600">CUSTOMER</th>
              <th className="px-4 py-4 border-r border-slate-600 text-right">TOTAL</th>
              <th className="px-4 py-4 border-r border-slate-600 text-center">RE-PRINT KOT</th>
              <th className="px-4 py-4 border-r border-slate-600 text-center">RE-PRINT</th>
              <th className="px-4 py-4 border-r border-slate-600 text-center">SELECT</th>
              <th className="px-4 py-4 text-center">SETTLE</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => {
              const uStatus = (order.status || 'RUNNING').toUpperCase();
              // In our IDB logic, 'SAVED' corresponds to 'BILLED' or old 'SAVED'
              const isSaved = uStatus === 'SAVED' || uStatus === 'BILLED';
              const isRunning = uStatus === 'RUNNING' || uStatus === 'MERGED';
              const isSettled = uStatus === 'SETTLED';
              const isCancelled = uStatus === 'CANCELLED';

              const canReprintKot = isRunning;
              const canReprintInvoice = isSaved || isSettled;
              const canSelect = isRunning || isSaved;
              const canSettle = isRunning || isSaved;

              return (
                <tr
                  key={order.id}
                  className={`border-b border-white hover:brightness-[0.98] transition-all cursor-pointer ${isSaved ? 'bg-[#dcfce7]' :
                    isRunning ? 'bg-[#fef9c3]' :
                      isCancelled ? 'bg-[#FF6B6B]' :
                        isSettled ? 'bg-[#dbeafe]' :
                          uStatus === 'MERGED' ? 'bg-[#fff7ed]' : 'bg-white'
                    }`}
                >
                  <td className="px-4 py-3 font-black text-slate-700 text-sm border-r border-white/30">{order.latestKotNo || 0}</td>
                  <td className="px-4 py-3 font-bold text-slate-600 text-[11px] border-r border-white/30">{order.createTime ? new Date(order.createTime).toLocaleString() : ''}</td>
                  <td className="px-4 py-3 text-center border-r border-white/30">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      {order.type === 'DI' ? 'DINE IN' : order.type === 'TA' ? 'TAKE AWAY' : 'DELIVERY'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-black italic text-blue-700 text-xs border-r border-white/30">{order.invoiceNo || ''}</td>
                  <td className="px-4 py-3 font-bold text-slate-700 text-[11px] border-r border-white/30">
                    {order.tableId ? `${floorsDb.find(f => f.id === tablesDb.find(t => t.id === order.tableId)?.floor)?.name || ''}/${order.tableId}` : ''}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-500 text-[11px] border-r border-white/30">
                    {customersDb.find(c => c.id === order.customerId)?.name || ''}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-800 text-sm border-r border-white/30">{(order.grandTotal || order.subTotal || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center border-r border-white/30">
                    <div className="flex justify-center h-8">
                      {canReprintKot && (
                        <button
                          onClick={(e) => { e.stopPropagation(); notify('Printing KOT', 'success'); }}
                          className="w-8 h-8 rounded-lg bg-white/50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-all shadow-sm"
                        >
                          <Printer size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white/30">
                    <div className="flex justify-center h-8">
                      {canReprintInvoice && (
                        <button
                          onClick={(e) => { e.stopPropagation(); notify('Printing Invoice', 'success'); }}
                          className="w-8 h-8 rounded-lg bg-white/50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-all shadow-sm"
                        >
                          <Printer size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white/30">
                    <div className="flex justify-center h-8">
                      {canSelect && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectOrder(order); }}
                          className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                        >
                          <MousePointer2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center h-8">
                      {canSettle && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSettleOrder(order); }}
                          className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                        >
                          <Wallet size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
                const settlementType = settlementStatus === 'RUNNING' || settlementStatus === 'MERGED' ? 'save' : 'settle';

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

                const finalMsg = isNC ? 'NC KOT Generated' : (settlementType === 'save' ? 'Bill Generated successfully' : 'Bill Settled successfully');
                notify(finalMsg, 'success');
                setShowSettleModal(null);
                if (settlementType === 'settle' || isNC) {
                  setShowPrintConfirm(true);
                }
              } catch (e) {
                console.error(e);
                notify("Transaction Failed", "error");
              }
            }}
          />
        )}
      </AnimatePresence>

      <PrintBillModal
        isOpen={showPrintConfirm}
        onConfirm={() => {
          notify('Printing receipt...', 'info');
          setShowPrintConfirm(false);
        }}
        onCancel={() => setShowPrintConfirm(false)}
      />
    </div>
  );
};

export default OrdersListPage;
