import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, MousePointer2, Wallet } from 'lucide-react';
import { customersDb, floorsDb, tablesDb } from '../../data/mockDb';

const OrderDetailsModal = ({ order, onClose, onSelect, onSettle, onPrint, config }) => {
  if (!order) return null;
  const customerName = customersDb.find(c => c.id === order.customerId)?.name || 'Walk-in Customer';
  const floorName = order.tableId ? (floorsDb.find(f => f.id === tablesDb.find(t => String(t.id) === String(order.tableId))?.floor)?.name || '') : '';
  const tableName = order.tableId ? `${floorName} / T-${order.tableId}` : (order.type === 'TA' ? 'Take Away' : (order.type === 'DE' ? 'Home Delivery' : 'Dine In (Self Service)'));
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
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Information</span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none mt-1">{tableName}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 mb-8">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">KOT Number</span>
            <span className="text-sm font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg">#{order.latestKotNo || '0'}</span>
          </div>
          {order.invoiceNo && (
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Invoice No</span>
              <span className="text-[11px] font-black text-blue-600 italic bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{order.invoiceNo}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Customer</span>
            <span className="text-[11px] font-bold text-slate-600">{customerName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Time Created</span>
            <span className="text-[11px] font-bold text-slate-600">{new Date(order.createTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
          </div>
          <div className="flex justify-between py-2 items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Grand Total</span>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{config.currencySymbol}{(order.grandTotal || order.total || order.subTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { onPrint(order); onClose(); }}
            className={`flex flex-col items-center justify-center gap-2 py-4 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-all font-black text-[9px] uppercase tracking-widest active:scale-95 ${!(isRunning || isSaved) ? 'col-span-3' : ''}`}
          >
            <Printer size={18} /> Print
          </button>
          {(isRunning || isSaved) && !order.status?.toLowerCase().includes('cancelled') && (
            <button
              onClick={() => { onSelect(order); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-800 rounded-2xl text-white hover:bg-slate-900 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95"
            >
              <MousePointer2 size={18} /> Select
            </button>
          )}
          {(isRunning || isSaved) && !order.status?.toLowerCase().includes('cancelled') && (
            <button
              onClick={() => { onSettle(order); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-600 rounded-2xl text-white hover:bg-emerald-700 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95"
            >
              <Wallet size={18} /> Settle
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailsModal;
