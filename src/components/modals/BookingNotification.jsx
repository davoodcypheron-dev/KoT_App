import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, ShoppingCart, X, AlertCircle, Phone, Smartphone, CheckCircle2 } from 'lucide-react';
import { getAllBookings, updateBookingStatus, saveToStore, ORDERS_STORE, ORDER_ITEMS_STORE, saveBooking, getCustomerById, TABLES_STORE, getAllFromStore } from '../../data/idb';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import AuthorizerModal from './AuthorizerModal';

const BookingNotification = () => {
    const { notify, config, setSelectedTable, setSelectedCustomer, setCart, setOrderNotes } = useApp();
    const navigate = useNavigate();
    const [activeBooking, setActiveBooking] = useState(null);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showSnoozeInput, setShowSnoozeInput] = useState(false);
    const [showCancelAuth, setShowCancelAuth] = useState(false);
    const [showArrivalConfirm, setShowArrivalConfirm] = useState(false);
    const [enteredMobile, setEnteredMobile] = useState('');
    const [notiSound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    useEffect(() => {
        if (activeBooking) {
            notiSound.loop = true;
            notiSound.play().catch(e => console.log("Sound play blocked", e));
        } else {
            notiSound.pause();
            notiSound.currentTime = 0;
        }
        return () => notiSound.pause();
    }, [activeBooking]);

    useEffect(() => {
        const checkReached = async () => {
            try {
                const bookings = await getAllBookings();
                const reached = bookings.find(b => b.status === 'REACHED');
                if (reached && (!activeBooking || activeBooking.id !== reached.id)) {
                    setActiveBooking(reached);
                    if (reached.customerId) {
                        const cust = await getCustomerById(reached.customerId);
                        setCustomerInfo(cust);
                    } else {
                        setCustomerInfo(null);
                    }
                }
            } catch (e) {
                console.error("Failed to check reached bookings", e);
            }
        };

        const interval = setInterval(() => {
            checkReached();
            setCurrentTime(new Date());
        }, 5000);
        return () => clearInterval(interval);
    }, [activeBooking]);

    if (!activeBooking) return null;

    const getTimeDiff = () => {
        const bTime = new Date(activeBooking.bookingTime);
        const diffMs = currentTime - bTime;

        const { hrs, mins, sec } = getTimeDiffInMins(diffMs < 0 ? (-1 * diffMs) : diffMs);

        if (diffMs < 0) {
            // Not due yet (though reached trigger suggests it is, or we're in early buffer)
            return { label: 'Time Left', value: `${hrs > 0 ? hrs + ':' : ''}${mins > 0 ? mins + ':' : ''}${sec}`, color: 'text-emerald-600' };
        }

        return { label: 'Overdue by', value: `${hrs > 0 ? hrs + ':' : ''}${mins > 0 ? mins + ':' : ''}${sec}`, color: 'text-rose-600 animate-pulse' };
    };

    const getTimeDiffInMins = (diffMs) => {
        // 1. Calculate total units
        const totalSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);

        // 2. Get the "remainder" for each unit to display
        const hrs = totalHours.toString().padStart(2, '0');
        const mins = (totalMinutes % 60).toString().padStart(2, '0');
        const sec = (totalSeconds % 60).toString().padStart(2, '0');

        return { hrs, mins, sec };
    };

    const timeInfo = getTimeDiff();

    const snoozeOptions = [
        { label: '5 Min', mins: 5 },
        { label: '10 Min', mins: 10 },
        { label: '15 Min', mins: 15 },
        { label: '30 Min', mins: 30 },
        { label: '45 Min', mins: 45 },
        { label: '1 Hour', mins: 60 }
    ];

    const handleSnooze = async (mins) => {
        try {
            const newReminder = new Date();
            newReminder.setMinutes(newReminder.getMinutes() + mins);

            const updated = {
                ...activeBooking,
                status: 'CONFIRMED',
                reminderTime: newReminder.toISOString(),
                lastDismissedTime: null
            };

            await saveBooking(updated);
            notify(`Rescheduled for ${mins} minutes later`, 'info');
            setActiveBooking(null);
            setShowSnoozeInput(false);
        } catch (e) {
            notify('Failed to snooze', 'error');
        }
    };

    const handleGenerateOrder = async () => {
        if (activeBooking.type === 'DINE' && !showArrivalConfirm) {
            setShowArrivalConfirm(true);
            setEnteredMobile('');
            return;
        }

        try {
            // 1. Clear previous order and set new context
            if (activeBooking.type === 'DINE') {
                if (enteredMobile !== activeBooking.customerMobile) {
                    return notify('Error: Customer mobile number does not match!', 'error');
                }

                const tables = await getAllFromStore(TABLES_STORE);
                const table = tables.find(t => t.id === activeBooking.tableId);
                if (table) {
                    // Update booking status to COMPLETED
                    await updateBookingStatus(activeBooking.id, 'COMPLETED');

                    await setSelectedTable(table);
                    if (customerInfo) setSelectedCustomer(customerInfo);
                    setOrderNotes(activeBooking.remarks || '');

                    notify('Reservation accepted and table occupied!', 'success');
                    setActiveBooking(null);
                    setShowArrivalConfirm(false);
                    navigate('/kot');
                }
            } else {
                // Delivery
                if (customerInfo) setSelectedCustomer(customerInfo);
                setOrderNotes(activeBooking.remarks || '');

                // Map items to cart format
                const mappedCart = (activeBooking.items || []).map(item => ({
                    ...item,
                    isSaved: false
                }));
                setCart(mappedCart);

                // Update booking status to COMPLETED or leave as REACHED? 
                // Usually for delivery, once generated, it's processed.
                await updateBookingStatus(activeBooking.id, 'COMPLETED');

                notify('Delivery order loaded to KOT', 'success');
                setActiveBooking(null);
                navigate('/kot');
            }
        } catch (e) {
            console.error(e);
            notify('Failed to generate order', 'error');
        }
    };

    const handleCancelConfirmed = async () => {
        try {
            await updateBookingStatus(activeBooking.id, 'CANCELLED');
            notify('Booking cancelled', 'success');
            setActiveBooking(null);
            setShowCancelAuth(false);
        } catch (e) {
            notify('Cancellation failed', 'error');
        }
    };

    const handleDismiss = async () => {
        const updated = {
            ...activeBooking,
            status: 'CONFIRMED',
            lastDismissedTime: new Date().toISOString()
        };
        await saveBooking(updated);
        setActiveBooking(null);
    };

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pointer-events-none">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] border border-indigo-100 overflow-hidden pointer-events-auto"
                    >
                        <div className={`p-8 text-white relative overflow-hidden ${activeBooking.type === 'DINE' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                    <Bell className="animate-bounce" size={28} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black uppercase tracking-tight leading-none">Booking Reminder</h3>
                                        <div className="px-3 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            {activeBooking.type}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mt-2">
                                        {activeBooking.type === 'DINE' ? 'Arrival Time Reached' : 'Delivery Reminder Set'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Customer Details</span>
                                        <span className="text-lg font-black text-slate-800 uppercase block leading-none">
                                            {customerInfo?.name || activeBooking.customerName || 'Guest'}
                                        </span>
                                        <span className="text-sm font-bold text-slate-500 block mt-1">
                                            {customerInfo?.mobile || activeBooking.customerMobile || 'No Phone'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{timeInfo.label}</span>
                                        <span className={`text-2xl font-black leading-none ${timeInfo.color}`}>
                                            {timeInfo.value}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock size={14} />
                                    <span className="text-xs font-bold font-mono uppercase">
                                        {activeBooking.type === 'DINE' ? 'Arrival' : 'Delivery'}: {new Date(activeBooking.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {showSnoozeInput ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center mb-2">Select Duration</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {snoozeOptions.map(opt => (
                                                <button
                                                    key={opt.mins}
                                                    onClick={() => handleSnooze(opt.mins)}
                                                    className="h-12 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-700 transition-all uppercase"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSnoozeInput(false)}
                                        className="w-full h-12 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest mt-2"
                                    >
                                        Back
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowCancelAuth(true)}
                                        className="h-16 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 border border-rose-100"
                                    >
                                        <X size={16} /> Cancel {activeBooking.type === 'DINE' ? 'Reservation' : 'Order'}
                                    </button>
                                    <button
                                        onClick={() => setShowSnoozeInput(true)}
                                        className="h-16 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <Clock size={16} /> Snooze
                                    </button>
                                    <button
                                        onClick={handleGenerateOrder}
                                        className={`h-16 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 col-span-2 ${activeBooking.type === 'DINE' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                                    >
                                        <ShoppingCart size={16} /> {activeBooking.type === 'DINE' ? 'Accept Reservation' : 'Generate Order'}
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleDismiss}
                                className="w-full py-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-[0.3em] transition-all"
                            >
                                Dismiss for now (30s)
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            <AuthorizerModal
                isOpen={showCancelAuth}
                onClose={() => setShowCancelAuth(false)}
                onAuthorize={handleCancelConfirmed}
                permissionKey="cancelOrder"
                title="Cancellation Auth"
                message={`Authorize to cancel this ${activeBooking.type.toLowerCase()}.`}
            />

            {/* Reservation Arrival Confirmation Modal */}
            <AnimatePresence>
                {showArrivalConfirm && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowArrivalConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                    <Smartphone size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Verify Arrival</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Table {activeBooking.tableId} Reservation</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</span>
                                    <span className="text-sm font-black text-slate-700 uppercase">{customerInfo?.name || activeBooking.customerName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival Time</span>
                                    <span className="text-sm font-black text-indigo-600">{new Date(activeBooking.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block ml-1 mb-2">Verify Mobile Number *</label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="text"
                                            placeholder="Enter matching mobile number..."
                                            value={enteredMobile}
                                            onChange={(e) => setEnteredMobile(e.target.value)}
                                            className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-xs font-black focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleGenerateOrder}
                                    className={`h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${enteredMobile === activeBooking.customerMobile ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                                >
                                    Confirm & Access Table
                                </button>
                                <button onClick={() => { setShowArrivalConfirm(false); setEnteredMobile(''); }} className="py-4 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BookingNotification;
