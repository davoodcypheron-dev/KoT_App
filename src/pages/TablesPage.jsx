import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users, Eye, Save, Check, Armchair,
  ChevronUp, ChevronDown, Calendar,
  AlertCircle, Clock, Banknote, User, ChevronRight, ChevronLeft, Users as UsersIcon,
  CreditCard, Smartphone, BookOpen, Gift, Layers, Wallet, MapPin, Phone, CheckCircle2, QrCode, Plus, Tag,
  Landmark, Ticket, Trash2, X, Shield
} from 'lucide-react';
import { tablesDb, customersDb, ledgersDb, floorsDb, ordersDb, usersDb, waitersDb } from '../data/mockDb';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PaxModal from '../components/modals/PaxModal';
import AuthorizerModal from '../components/modals/AuthorizerModal';
import SettlementModal from '../components/modals/SettlementModal';
import PrintBillModal from '../components/modals/PrintBillModal';
import { getOrderById, getActiveOrdersByType, saveToStore, ORDERS_STORE, getAllBookings, updateBookingStatus } from '../data/idb';

const TablesPage = () => {
  const {
    setSelectedTable, config, setConfig, waiters, selectedWaiter, setSelectedWaiter,
    pax, setPax, deliveryAgent, setDeliveryAgent, notify
  } = useApp();
  const navigate = useNavigate();

  const [showPaxModal, setShowPaxModal] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(null); // stores table object
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [paxInput, setPaxInput] = useState('');
  const [liveOrders, setLiveOrders] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [showReservationModal, setShowReservationModal] = useState(null);
  const [waiterPin, setWaiterPin] = useState('');
  const [showAuthForResvCancel, setShowAuthForResvCancel] = useState(false);

  // Load Active IDB Dine-In Orders
  React.useEffect(() => {
    let isMounted = true;
    const fetchLiveOrders = async () => {
      try {
        const diOrders = await getActiveOrdersByType('DI');
        if (isMounted) {
          setLiveOrders(diOrders || []);
        }
      } catch (e) {
        console.error("Failed loading IDB orders", e);
      }
    };

    fetchLiveOrders();
    const intervalId = setInterval(fetchLiveOrders, 2000);

    const fetchBookings = async () => {
      try {
        const data = await getAllBookings();
        if (isMounted) setActiveBookings(data.filter(b => b.type === 'DINE' && b.status === 'CONFIRMED'));
      } catch (e) { }
    };
    fetchBookings();
    const bInterval = setInterval(fetchBookings, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      clearInterval(bInterval);
    };
  }, []);

  // Redirect to KOT if default order type is not Dine-In
  React.useEffect(() => {
    if (config.defaultKotType === 'TA' || config.defaultKotType === 'DE' || config.defaultKotType === 'HD') {
      navigate('/kot');
    }
  }, [config.defaultKotType, navigate]);

  const floors = floorsDb;

  const handleTableClick = async (table) => {
    // Check against real IDB orders mapping to this table
    const activeOrder = liveOrders.find(o => o.tableId === table.id);

    if (table.status === 'vacant') {
      let currentWaiter = selectedWaiter;

      // Auto-select waiter from user mapping if not already selected
      if (!currentWaiter) {
        const currentUser = usersDb.find(u => u.id === config.activeUserId);
        if (currentUser?.waiterId) {
          const mappedWaiter = waitersDb.find(w => w.id === currentUser.waiterId);
          if (mappedWaiter) {
            setSelectedWaiter(mappedWaiter);
            currentWaiter = mappedWaiter;
          }
        }
      }

      // If still no waiter, notify user
      if (!currentWaiter) {
        notify('Please select a waiter to continue', 'error');
        return;
      }

      console.log(config.paxMandatory)

      if (!config.paxMandatory) {
        await setSelectedTable(table, 1, null);
        setConfig({ ...config, defaultKotType: 'DI' });
        navigate('/kot');
      } else {
        setShowPaxModal(table);
        setPaxInput('');
      }
    } else if (table.status === 'running' || table.status === 'billed') {
      if (!activeOrder) {
        notify(`Table ${table.id} is not vacant but no active order found. Data inconsistency!`, 'error');
        return;
      }
      await setSelectedTable(table, activeOrder.pax || 1, activeOrder.id);
      setConfig({ ...config, defaultKotType: 'DI' });
      navigate('/kot');
    }
  };

  const confirmPax = async () => {
    const p = parseInt(paxInput) || 0;
    if (config.paxMandatory && p <= 0) {
      notify('Guest count (PAX) is mandatory', 'error');
      return;
    }
    // Fallback to 1 if p is 0 and not mandatory
    await setSelectedTable(showPaxModal, p || 1, null);
    setConfig({ ...config, defaultKotType: 'DI' });
    setShowPaxModal(null);
    navigate('/kot');
  };

  const waiterListRef = React.useRef(null);

  const scrollWaiters = (direction) => {
    if (waiterListRef.current) {
      const scrollAmount = 200;
      waiterListRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fdf2f2] overflow-hidden p-1.5">
      {/* Legend / Status Bar */}
      <div className="bg-[#fcf5d5] rounded-t-xl border border-gray-200 p-2.5 flex justify-between items-center text-[10px] uppercase font-black text-slate-500 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">Floor Selection</span>
          <div className="flex gap-4 border-l border-slate-300 pl-4">
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-white border border-slate-300"></span> Vacant</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-[#fde68a] border border-yellow-400"></span> Running</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-[#bbf7d0] border border-green-400"></span> Billed</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-600"></span> Reserved</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-1.5 overflow-hidden mt-1.5 font-sans">
        {/* Table Grid (scrollable) */}
        <div className="flex-1 bg-[#f0f9ff] border border-slate-200 rounded-bl-xl p-6 overflow-y-auto custom-scrollbar relative shadow-inner">
          <div className="max-w-[1400px] mx-auto space-y-12">
            {floors.map(floor => (
              <div key={floor.id}>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-[#1e56a0] font-black text-xs uppercase tracking-[0.2em]">{floor.name}</h3>
                  <div className="flex-1 h-[1px] bg-blue-100" />
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-3">
                  {tablesDb.filter(t => t.floor === floor.id).map(table => {


                    const getTimeDifference = (startTime) => {
                      if (!startTime) return '';

                      // Ensure 'T' is replaced if present to maintain cross-browser date parsing
                      const cleanedDate = startTime.replace('T', ' ');
                      const start = new Date(cleanedDate).getTime();
                      const now = new Date().getTime();

                      if (isNaN(start)) return 'Invalid Date';

                      const diffInMs = now - start;
                      const totalMins = Math.floor(diffInMs / (1000 * 60));

                      if (totalMins < 0) return '0m';

                      const hrs = Math.floor(totalMins / 60);
                      const mins = totalMins % 60;

                      // Returns "1h 5m" or just "5m" if hrs is 0
                      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                    };

                    const activeOrder = liveOrders.find(o => o.tableId === table.id);
                    const booking = activeBookings.find(b => b.tableId === table.id);

                    const tableAmount = activeOrder ? activeOrder.grandTotal || 0 : 0;
                    let tableStatus = activeOrder ? (activeOrder.status || 'running').toLowerCase() : 'vacant';
                    if (tableStatus === 'vacant' && booking) tableStatus = 'reserved';

                    const kotCount = activeOrder ? activeOrder.latestKotNo || 0 : 0;
                    const timeStr = activeOrder && activeOrder.createTime ? getTimeDifference(activeOrder.createTime) : '';
                    const invoiceTimeStr = activeOrder && activeOrder.billTime ? getTimeDifference(activeOrder.billTime) : '';

                    return (
                      <div
                        key={table.id}
                        onClick={() => {
                          if (tableStatus === 'vacant') { handleTableClick({ ...table, status: tableStatus, amount: tableAmount }) }
                          else if (tableStatus === 'reserved') { setShowReservationModal(booking) }
                        }}
                        className={`group aspect-square rounded-2xl border shadow-sm flex flex-col relative overflow-hidden transition-all touch-btn active:scale-90 cursor-pointer ${tableStatus === 'vacant' ? 'bg-white border-slate-200 hover:border-blue-300' :
                          tableStatus === 'running' ? 'bg-[#fde68a] border-yellow-500' :
                            tableStatus === 'reserved' ? 'bg-indigo-500 border-indigo-700 text-white' :
                              'bg-[#bbf7d0] border-green-500'
                          }`}
                      >
                        {tableStatus === 'vacant' ? (
                          <div className="flex-1 flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform">
                            <span className="font-black text-lg text-slate-700">{table.id}</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Available</span>
                          </div>
                        ) : tableStatus === 'reserved' ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-2">
                            <div className="absolute top-1 right-1 border border-white/20 bg-white/10 rounded-lg px-2 py-1 flex items-center gap-1">
                              <Clock size={8} /> <span className="text-[9px] font-black">{new Date(booking.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="font-black text-lg text-white">{table.id}</span>
                            <span className="text-[8px] font-black text-indigo-100 uppercase">{booking.customerName}</span>
                            <div className="mt-1 text-[10px] font-black text-white/90 bg-white/20 px-3 py-1 rounded-full border border-white/20">
                              {booking.pax} PAX
                            </div>
                          </div>
                        ) : tableStatus === 'running' ? (
                          <>
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[#b45309]">
                              <Clock size={8} strokeWidth={3} />
                              <span className="text-[9px] font-black uppercase">{timeStr}</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center pt-2">
                              <span className="font-black text-sm text-slate-900">{table.id}</span>
                              <div className="items-center gap-1 mt-0.5">
                                <p className="text-[9px] font-black text-yellow-800 leading-none m-1">KOT: {kotCount}</p>
                                <p className="text-[10px] font-black text-blue-700 leading-none m-1">{config.currencySymbol}{tableAmount}</p>
                              </div>
                            </div>
                            <div className="flex h-11 border-t border-yellow-500/30 overflow-hidden shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTableClick({ ...table, status: tableStatus, amount: tableAmount }); }}
                                className="flex-1 bg-white/40 hover:bg-white/60 flex items-center justify-center text-yellow-900 border-r border-yellow-500/30 transition-colors"
                              >
                                <Eye size={16} strokeWidth={3} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowSettleModal({ ...table, status: tableStatus, amount: tableAmount, orderId: activeOrder?.id }); }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors shadow-inner"
                              >
                                <Save size={16} strokeWidth={3} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute top-2 right-2 text-emerald-700 font-black text-[8px] uppercase tracking-tighter">{invoiceTimeStr}</div>
                            <div className="flex-1 flex flex-col items-center justify-center pt-4">
                              <span className="font-black text-sm text-slate-900">{table.id}</span>
                              <span className="text-[11px] font-black text-emerald-700 leading-none mt-1">{config.currencySymbol}{tableAmount}</span>
                              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">{activeOrder?.invoiceNo || 'Billed'}</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowSettleModal({ ...table, status: tableStatus, amount: tableAmount, orderId: activeOrder?.id }); }}
                              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-lg"
                            >
                              <Banknote size={20} strokeWidth={3} />
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Waiter Selection */}
        <div className="w-60 flex flex-col gap-1.5 shrink-0">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex flex-col overflow-hidden relative shadow-sm">
            <button
              onClick={() => scrollWaiters('up')}
              className="h-10 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl mb-2 flex items-center justify-center transition-all active:scale-95 z-10 shadow-sm"
            >
              <ChevronUp size={24} />
            </button>

            <div
              ref={waiterListRef}
              className="flex-1 overflow-y-auto custom-scrollbar-visible space-y-2 py-1 px-1"
            >
              {waiters.map(waiter => (
                <button
                  key={waiter.id}
                  onClick={() => setSelectedWaiter(waiter)}
                  className={`w-full h-14 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all touch-btn flex flex-col items-center justify-center relative overflow-hidden shrink-0 ${selectedWaiter?.id === waiter.id
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xl'
                    : 'bg-sky-100 text-sky-800 border-sky-200'
                    }`}
                >
                  <User size={14} className={selectedWaiter?.id === waiter.id ? 'text-white mb-1 shadow-sm' : 'text-sky-300 mb-1'} />
                  <span className="line-clamp-1 px-2 text-center">{waiter.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollWaiters('down')}
              className="h-10 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl mt-2 flex items-center justify-center transition-all active:scale-95 z-10 shadow-sm"
            >
              <ChevronDown size={24} />
            </button>
          </div>
        </div>
      </div>

      <PaxModal
        isOpen={!!showPaxModal}
        table={showPaxModal}
        paxInput={paxInput}
        setPaxInput={setPaxInput}
        onClose={() => setShowPaxModal(null)}
        onAccept={confirmPax}
      />

      <AnimatePresence>
        {showSettleModal && (
          <SettlementModal
            type={(showSettleModal.status?.toLowerCase() === 'running' || showSettleModal.status?.toLowerCase() === 'merged') ? 'save' : 'settle'}
            table={showSettleModal}
            total={showSettleModal.amount}
            onClose={() => setShowSettleModal(null)}
            onProcess={async (msg, paymentData) => {
              try {
                let activeOrder = await getOrderById(showSettleModal.orderId);
                if (!activeOrder) {
                  activeOrder = liveOrders.find(o => o.tableId === showSettleModal.id);
                }
                if (!activeOrder) { notify('No active order exists!', 'error'); return; }

                const isNC = paymentData?.method === 'NC';
                const settlementType = showSettleModal.status === 'running' ? 'save' : 'settle';

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
                console.error(e); notify("Failed to process transaction", "error");
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

      {/* Reservation Arrival Confirmation Modal */}
      <AnimatePresence>
        {showReservationModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReservationModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <Calendar size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Confirm Arrival</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Reservation for Table {showReservationModal.tableId}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</span>
                  <span className="text-sm font-black text-slate-700 uppercase">{showReservationModal.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Time</span>
                  <span className="text-sm font-black text-indigo-600">{new Date(showReservationModal.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guests (Pax)</span>
                  <span className="text-sm font-black text-slate-700">{showReservationModal.pax}</span>
                </div>
                {showReservationModal.advancePaid > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance Paid</span>
                    <span className="text-sm font-black text-emerald-600">₹{showReservationModal.advancePaid.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block ml-1">Waiter PIN to Authorize *</label>
                  <div className="relative">
                    <Shield size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="password"
                      placeholder="Enter Waiter PIN..."
                      value={waiterPin}
                      onChange={(e) => setWaiterPin(e.target.value)}
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-black focus:border-indigo-500 outline-none transition-all text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    const matchedWaiter = waiters.find(w => w.pass === waiterPin);
                    if (!matchedWaiter) {
                      return notify('Error: Invalid Waiter PIN!', 'error');
                    }

                    const table = tablesDb.find(t => t.id === showReservationModal.tableId);
                    const customer = customersDb.find(c => c.id === showReservationModal.customerId);

                    // 1. Mark booking as completed
                    await updateBookingStatus(showReservationModal.id, 'COMPLETED');

                    // 2. Set App Context
                    setSelectedWaiter(matchedWaiter);
                    if (customer) setSelectedCustomer(customer);
                    await setSelectedTable(table, showReservationModal.pax, null);
                    setConfig({ ...config, defaultKotType: 'DI' });

                    setShowReservationModal(null);
                    setWaiterPin('');
                    notify(`Authorized by ${matchedWaiter.name}!`, 'success');
                    navigate('/kot');
                  }}
                  className={`h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${waiterPin.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                >
                  Confirm Arrival & Open Table
                </button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowAuthForResvCancel(true);
                    }}
                    className="py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Cancel Resv.
                  </button>
                  <button
                    onClick={() => { setShowReservationModal(null); setWaiterPin(''); }}
                    className="py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AuthorizerModal
        isOpen={showAuthForResvCancel}
        onClose={() => setShowAuthForResvCancel(false)}
        onAuthorize={async (authorizedUser) => {
          if (showReservationModal) {
            await updateBookingStatus(showReservationModal.id, 'CANCELLED');
            notify(`Reservation cancelled by ${authorizedUser.user}`, 'info');
            setShowReservationModal(null);
            setWaiterPin('');
            setShowAuthForResvCancel(false);
          }
        }}
        title="Cancel Authorization"
        message="Enter Admin/Manager credentials to cancel reservation"
      />
    </div>

  );
};

export default TablesPage;
