
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, User, Phone, MapPin, Tag, CreditCard, Smartphone, BookOpen, Layers, Gift, Truck, Save, Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { customersDb, paymentMethodsDb, deliveryAgentsDb, ledgersDb } from '../../data/mockDb';
import CreditModal from './CreditModal';
import MultiPaymentsModal from './MultiPaymentsModal';
import DeliveryAgentModal from './DeliveryAgentModal';
import { ordersDb } from '../../data/mockDb';
import { saveToStore, ORDERS_STORE, getOrderById, getOrderByTable, saveCustomer, getCustomerById as getCustById } from '../../data/idb';

const SettlementModal = ({ type, table, total, onClose, onProcess, orderType, isOpen }) => {
  const { setSelectedCustomer, selectedCustomer, notify, config, deliveryAgent, setDeliveryAgent } = useApp();
  const [custName, setCustName] = useState(selectedCustomer?.name || '');
  const [custMobile, setCustMobile] = useState(selectedCustomer?.mobile || '');
  const [custAddress, setCustAddress] = useState(selectedCustomer?.address || '');
  const [regNo, setRegNo] = useState(selectedCustomer?.regNo || '');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [customerCash, setCustomerCash] = useState('');
  const [payReference, setPayReference] = useState('');

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [multiPayments, setMultiPayments] = useState([]);
  const [showAgentModal, setShowAgentModal] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [effectiveOrderType, setEffectiveOrderType] = useState(orderType);
  const [orderNumber, setOrderNumber] = useState('');

  // Pre-load logic for order and customer info
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        let order = null;
        if (table?.orderId) {
          order = await getOrderById(table.orderId);
        } else if (table?.id) {
          order = await getOrderByTable(table.id);
        }

        if (order) {
          setActiveOrder(order);
          setEffectiveOrderType(order.type);
          setOrderNumber(order.kotNo);

          if (order.customerId) {
            let c = customersDb.find(cust => cust.id === order.customerId);
            if (!c) {
              c = await getCustById(order.customerId);
            }
            if (c) {
              setCustName(c.name || '');
              setCustMobile(c.mobile || '');
              setCustAddress(c.address || '');
              setRegNo(c.regNo || '');
              setSelectedCustomer(c);
            }
          }
        } else if (selectedCustomer) {
          // Fallback to currently selected customer in context if no order link exists yet (e.g. fresh DE/TA)
          setCustName(selectedCustomer.name || '');
          setCustMobile(selectedCustomer.mobile || '');
          setCustAddress(selectedCustomer.address || '');
          setRegNo(selectedCustomer.regNo || '');
        }
      } catch (e) {
        console.error("Order Load Failed", e);
      }
    };

    if (isOpen) loadOrderData();
  }, [isOpen, table, orderType]);

  const isDelivery = effectiveOrderType === 'DE' || effectiveOrderType === 'HD';

  useEffect(() => {
    const term = custName || custMobile;
    if (term.length > 0) {
      setFilteredSuggestions(customersDb.filter(c =>
        c.name.toLowerCase().includes(term.toLowerCase()) ||
        c.mobile.includes(term)
      ).slice(0, 5));
    } else {
      setFilteredSuggestions([]);
    }
  }, [custName, custMobile]);

  const handleSelectCustomer = (c) => {
    setCustName(c.name);
    setCustMobile(c.mobile);
    setCustAddress(c.address);
    setRegNo(c.regNo);
    setSelectedCustomer(c);
    setShowSuggestions(false);
  };

  const handleSyncCustomer = async () => {
    try {
      const customer = {
        id: selectedCustomer?.id || "CUST_" + Date.now(),
        name: custName,
        mobile: custMobile,
        address: custAddress,
        regNo: regNo
      };

      await saveCustomer(customer);
      setSelectedCustomer(customer);

      if (activeOrder) {
        activeOrder.customerId = customer.id;
        await saveToStore(ORDERS_STORE, activeOrder);
      }
    } catch (e) {
      console.error(e);
      notify('Persistence Error', 'error');
    }
  };

  const getMethodIcon = (id) => {
    switch (id) {
      case 'cash': return <Banknote size={28} />;
      case 'card': return <CreditCard size={28} />;
      case 'upi': return <Smartphone size={28} />;
      case 'credit': return <BookOpen size={28} />;
      case 'other': return <Layers size={28} />;
      case 'compliment': return <Gift size={28} />;
      default: return null;
    }
  };
  const handleProcess = async (methodName) => {
    // Sync customer record first
    await handleSyncCustomer();

    if (isDelivery) {
      if (!custName.trim() || !custMobile.trim()) {
        notify('Customer Name and Mobile are mandatory for delivery orders', 'error');
        return;
      }
    }

    if (type === 'save') {
      onProcess(`Bill Generated : ${methodName}`, { method: methodName, isMulti: false });
    } else {
      onProcess(`Settled to ${methodName}`, { method: methodName, isMulti: false });
    }
  };

  const paymentMethods = paymentMethodsDb.map(m => ({
    ...m,
    icon: getMethodIcon(m.id)
  })).sort((a, b) => (a.priority || 99) - (b.priority || 99));


  const balCashValue = (parseFloat(customerCash) || 0) - total;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Banknote size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                {type === 'save' ? 'Save Bill' : 'Settlement'}: KOT {orderNumber}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction View</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payable Amount</span>
            <span className="text-3xl font-black text-blue-600 font-mono tracking-tighter">{config.currencySymbol}{total}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="grid grid-cols-2 gap-10">

            {/* LEFT COLUMN: CUSTOMER INFO */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-4 w-1 bg-blue-500 rounded-full" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Customer Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">
                    Customer Name {isDelivery && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => { setCustName(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Name..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">
                    Mobile Number {isDelivery && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      value={custMobile}
                      onChange={(e) => { setCustMobile(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Mobile..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {showSuggestions && (custName || custMobile) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden"
                    >
                      <div className="bg-slate-50/80 px-4 py-2 flex justify-between border-b border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile</span>
                      </div>
                      {filteredSuggestions.length > 0 ? filteredSuggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectCustomer(s)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-all text-left"
                        >
                          <span className="font-bold text-slate-700 text-[11px]">{s.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{s.mobile}</span>
                        </button>
                      )) : (
                        <div className="p-3 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New Customer Account</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 text-slate-300" size={16} />
                  <textarea
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="Physical location..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner h-16 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Reg. Number (TRN/VAT)</label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl h-11 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Invoice Description</label>
                <textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  placeholder="Additional notes for invoice..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner h-20 resize-none"
                />
              </div>


            </div>

            {/* RIGHT COLUMN: PAYMENT INFO */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Payment Settlement</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Customer Cash</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">₹</span>
                    <input
                      type="number"
                      value={customerCash}
                      onChange={(e) => setCustomerCash(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl h-14 pl-10 pr-4 text-xl font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-300 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Cash</span>
                  <div className={`text-2xl font-black font-mono tracking-tighter ${balCashValue >= 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                    ₹{balCashValue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Pay Reference</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    placeholder="Transaction ID / Ref..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                  />
                </div>
              </div>

              {config.settleByLedger ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-blue-500" size={16} />
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Ledger to {type === 'save' ? 'Save' : 'Settle'}</span>
                  </div>
                  <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                    {ledgersDb.map(ledger => (
                      <motion.button
                        key={ledger.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleProcess(ledger.name)}
                        className="w-[120px] h-16 bg-white border border-slate-100 rounded-xl flex items-center gap-3 px-3 shadow-sm hover:border-blue-200 hover:bg-blue-50/50 transition-all group snap-start shrink-0"
                      >
                        <div className="w-8 h-8 bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-lg flex items-center justify-center transition-colors shrink-0">
                          <Layers size={14} />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight text-left leading-tight line-clamp-2">{ledger.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {/* Primary Methods */}
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.filter(m => ['cash', 'card', 'upi'].includes(m.id)).map(m => (
                      <motion.button
                        key={m.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleProcess(m.name)}
                        className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm text-white ${m.color} relative overflow-hidden group`}
                      >
                        {React.cloneElement(m.icon, { size: 24 })}
                        <span className="text-[10px] font-black uppercase tracking-wider">{m.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Secondary Methods */}
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.filter(m => !['cash', 'card', 'upi'].includes(m.id)).map(m => (
                      <motion.button
                        key={m.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (m.id === 'credit') {
                            setShowCreditModal(true);
                          } else if (m.id === 'other') {
                            setShowMultiModal(true);
                          } else {
                            handleProcess(m.name);
                          }
                        }}
                        className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm text-white ${m.color} relative overflow-hidden group border border-white/10`}
                      >
                        {React.cloneElement(m.icon, { size: 18 })}
                        <span className="text-[9px] font-black uppercase tracking-wider">{m.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">

          {/* Left Side */}
          <button
            onClick={onClose}
            className="h-14 px-8 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all border border-slate-100"
          >
            Discard
          </button>

          {/* Delivery Agent Badge (if selected) */}
          {isDelivery && (
            <div className="pt-0 border-t border-slate-100 mt-0">
              <div className="flex items-center justify-between bg-sky-50 p-4 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white text-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Delivery Agent</span>
                    {deliveryAgent ? (
                      <span className="text-sm font-black text-slate-700 uppercase">{deliveryAgent.name}</span>
                    ) : (
                      <span className="text-xs font-bold text-rose-500 uppercase">Not Selected*</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentModal(true)}
                  className="px-4 py-2 ms-1 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-100 active:scale-95 transition-all"
                >
                  {deliveryAgent ? 'Change' : 'Select'}
                </button>
              </div>
            </div>
          )}

          {/* Right Side */}
          {(type === 'save' && (activeOrder?.status?.toLowerCase() === 'running' || activeOrder?.status?.toLowerCase() === 'merged')) && (
            <button
              onClick={() => handleProcess('NC')}
              className="h-14 px-8 bg-white text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center gap-3 border border-slate-200 shadow-sm"
            >
              <Layers size={18} className="text-orange-500" /> NC KOT
            </button>
          )}

        </div>
      </motion.div >

      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onProcess={onProcess}
      />

      <MultiPaymentsModal
        isOpen={showMultiModal}
        total={total}
        multiPayments={multiPayments}
        setMultiPayments={setMultiPayments}
        onClose={() => setShowMultiModal(false)}
        onProcess={onProcess}
        notify={notify}
      />
      <DeliveryAgentModal
        isOpen={showAgentModal}
        selectedAgent={deliveryAgent}
        onSelect={setDeliveryAgent}
        onClose={() => setShowAgentModal(false)}
      />
    </div >
  );
};

export default SettlementModal;
