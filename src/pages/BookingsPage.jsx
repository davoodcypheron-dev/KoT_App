import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, Users, User, Phone, MapPin,
    Tag, Plus, X, Search, CheckCircle2, AlertCircle,
    Trash2, ShoppingCart, Armchair, Bike, Wallet,
    ChevronRight, ArrowLeft, Info, Bell, Layers, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
    tablesDb, floorsDb, customersDb, itemsDb, organizersDb, groupsDb
} from '../data/mockDb';
import {
    saveBooking, getAllBookings, deleteBooking, getAllCustomers,
    ORDERS_STORE, ORDER_ITEMS_STORE, ORDER_ITEM_ADDONS_STORE,
    saveToStore, getOrderByTable, getAllProducts, getAllAddons, getAllItemAddonLinks,
    getCustomerByMobile, saveCustomer
} from '../data/idb';
import MultiPaymentsModal from '../components/modals/MultiPaymentsModal';
import AuthorizerModal from '../components/modals/AuthorizerModal';
import { useNavigate } from 'react-router-dom';

const BookingsPage = () => {
    const { config, notify, selectedCustomer, setSelectedCustomer } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('DINE'); // DINE or DELIVERY
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showNewBooking, setShowNewBooking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingBooking, setEditingBooking] = useState(null);

    // Filter States
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterType, setFilterType] = useState('ALL'); // ALL, DINE, DELIVERY

    // Form States - Common
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('19:00');
    const [remarks, setRemarks] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Form States - Dine In
    const [pax, setPax] = useState(2);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [vacantTables, setVacantTables] = useState([]);

    // Form States - Delivery
    const [cart, setCart] = useState([]);
    const [reminderTime, setReminderTime] = useState('18:30');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeGroup, setActiveGroup] = useState(groupsDb[0]?.id);
    const [deliveryDiscount, setDeliveryDiscount] = useState(0);
    const [newCustomer, setNewCustomer] = useState({ name: '', mobile: '', address: '', regNumber: '' });

    // Advance Payment State
    const [showPayment, setShowPayment] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [tempBookingData, setTempBookingData] = useState(null);
    const [multiPayments, setMultiPayments] = useState([]);

    // Auth State
    const [showAuth, setShowAuth] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    const [dbProducts, setDbProducts] = useState([]);
    const [dbAddons, setDbAddons] = useState([]);
    const [dbItemAddonLinks, setDbItemAddonLinks] = useState([]);

    const subTotal = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.qty), 0), [cart]);
    const totalAmount = useMemo(() => subTotal - parseFloat(deliveryDiscount || 0), [subTotal, deliveryDiscount]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const bDate = b.bookingTime.split('T')[0];
            const dateMatch = bDate === filterDate;
            const typeMatch = filterType === 'ALL' || b.type === filterType;
            return dateMatch && typeMatch;
        });
    }, [bookings, filterDate, filterType]);

    useEffect(() => {
        loadBookings();
        loadIdbData();
        loadCustomers();
        if (activeTab === 'DINE') {
            loadVacantTables();
        }
    }, [activeTab]);

    const loadBookings = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data.filter(b => b.status === 'CONFIRMED' || b.status === 'REACHED'));
        } catch (e) {
            console.error(e);
        }
    };

    const loadCustomers = async () => {
        try {
            const data = await getAllCustomers();
            setCustomers(data);
        }
        catch (e) {
            console.error(e);
        }
    }

    const loadIdbData = async () => {
        try {
            const [products, addons, links] = await Promise.all([
                getAllProducts(),
                getAllAddons(),
                getAllItemAddonLinks()
            ]);
            setDbProducts(products);
            setDbAddons(addons);
            setDbItemAddonLinks(links);
        } catch (e) {
            console.error("Failed to load IDB data", e);
        }
    };

    const loadVacantTables = async () => {
        setVacantTables(tablesDb.filter(t => t.status === 'vacant'));
    };

    const ensureCustomer = async () => {
        const name = newCustomer.name || selectedCustomer?.name;
        const mobile = newCustomer.mobile || selectedCustomer?.mobile;
        const address = newCustomer.address || selectedCustomer?.address || '';
        const regNumber = newCustomer.regNumber || selectedCustomer?.regNumber || '';

        let dbCust = await getCustomerByMobile(mobile);

        if (dbCust) {
            dbCust = { ...dbCust, name, address, regNumber };
            await saveCustomer(dbCust);
            return dbCust;
        } else {
            const newCustRecord = {
                id: "CUST_" + Date.now(),
                name,
                mobile,
                address,
                regNumber,
                createdTime: new Date().toISOString()
            };
            await saveCustomer(newCustRecord);
            return newCustRecord;
        }
    };

    const handleSaveDineBooking = async (isDirectSave) => {
        if (!selectedTableId) return notify('Please select a table', 'error');
        if (!newCustomer.name || !newCustomer.mobile) {
            return notify('Name and Mobile Number are mandatory', 'error');
        }

        setIsProcessing(true);
        try {
            const customerInfo = await ensureCustomer();
            const bTime = new Date(`${bookingDate}T${bookingTime}:00`);
            const rTime = new Date(`${bookingDate}T${reminderTime || bookingTime}:00`);

            const bookingData = {
                id: editingBooking?.id || ("BKG_DI_" + Date.now()),
                type: 'DINE',
                status: editingBooking?.status || 'CONFIRMED',
                customerId: customerInfo.id,
                customerName: customerInfo.name,
                customerMobile: customerInfo.mobile,
                customerAddress: customerInfo.address,
                customerRegNo: customerInfo.regNumber,
                bookingTime: bTime.toISOString(),
                reminderTime: rTime.toISOString(),
                createdTime: editingBooking?.createdTime || new Date().toISOString(),
                pax: parseInt(pax),
                tableId: selectedTableId,
                remarks: remarks,
                advancePaid: editingBooking?.advancePaid || 0,
            };

            if (isDirectSave) {
                await saveBooking(bookingData);
                notify('Reservation saved successfully', 'success');
                setShowNewBooking(false);
                clearForm();
                loadBookings();
                loadCustomers();
            } else {
                setTempBookingData(bookingData);
                setCurrentStep(3);
            }
        } catch (e) {
            console.error(e);
            notify('Failed to save reservation: ' + e.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async (paymentDetails) => {
        if (!tempBookingData) return;

        try {
            const finalBooking = {
                ...tempBookingData,
                advancePaid: paymentDetails.totalPaid,
                paymentDetails: paymentDetails.payments
            };

            await saveBooking(finalBooking);

            notify(`${tempBookingData.type === 'DINE' ? 'Reservation' : 'Delivery'} confirmed with advance!`, 'success');
            setShowPayment(false);
            setShowNewBooking(false);
            setCurrentStep(1);
            loadBookings();
            loadCustomers();
            clearForm();
        } catch (e) {
            notify('Failed to complete payment: ' + e.message, 'error');
        }
    };

    const clearForm = () => {
        setEditingBooking(null);
        setSelectedTableId(null);
        setSelectedCustomer(null);
        setRemarks('');
        setCart([]);
        setAdvanceAmount(0);
        setNewCustomer({ name: '', mobile: '', address: '', regNumber: '' });
        setCurrentStep(1);
        setTempBookingData(null);
    };

    const handleEditBooking = (booking) => {
        if (!booking || !booking.bookingTime) return;
        setEditingBooking(booking);
        setActiveTab(booking.type);

        try {
            if (booking.bookingTime.includes('T')) {
                setBookingDate(booking.bookingTime.split('T')[0]);
                setBookingTime(booking.bookingTime.split('T')[1].substring(0, 5));
            } else {
                // Fallback for non-ISO strings if any
                const d = new Date(booking.bookingTime);
                if (!isNaN(d.getTime())) {
                    setBookingDate(d.toISOString().split('T')[0]);
                    setBookingTime(d.toISOString().split('T')[1].substring(0, 5));
                }
            }
        } catch (e) {
            console.error("Date parsing failed", e);
        }

        setRemarks(booking.remarks || '');
        setNewCustomer({
            name: booking.customerName || '',
            mobile: booking.customerMobile || '',
            address: booking.customerAddress || '',
            regNumber: booking.customerRegNo || ''
        });

        if (booking.type === 'DINE') {
            setPax(booking.pax || 2);
            setSelectedTableId(booking.tableId);
        } else {
            setCart(booking.items || []);
            setReminderTime(booking.reminderTime?.split('T')[1].substring(0, 5) || '18:30');
            setDeliveryDiscount(booking.discount || 0);
        }

        setShowNewBooking(true);
        setCurrentStep(2); // Jump to details for editing usually
    };

    const handleCancelBooking = (id) => {
        setBookingToCancel(id);
        setShowAuth(true);
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        await deleteBooking(bookingToCancel);
        loadBookings();
        loadCustomers();
        notify('Booking cancelled successfully', 'info');
        setBookingToCancel(null);
        setShowAuth(false);
    };

    return (
        <div className="flex-1 flex flex-col bg-[#fdf2f2] overflow-hidden p-1.5 h-full relative">
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">

                {/* HEADER & TABS */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">

                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Bookings & Reservations</h1>

                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner gap-1">
                        <button
                            onClick={() => setActiveTab('DINE')}
                            className={`px-8 h-12 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'DINE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Armchair size={16} /> Dine-In
                        </button>
                        <button
                            onClick={() => setActiveTab('DELIVERY')}
                            className={`px-8 h-12 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'DELIVERY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Bike size={16} /> Delivery
                        </button>
                    </div>

                    <button
                        onClick={() => { clearForm(); setShowNewBooking(true); }}
                        className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                    >
                        <Plus size={20} strokeWidth={3} /> New Booking
                    </button>
                </div>

                {/* FILTER BAR */}
                <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                            {['ALL', 'DINE', 'DELIVERY'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-[11px] font-black outline-none focus:border-indigo-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total {filteredBookings.length} results
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBookings.length === 0 ? (
                            <div className="col-span-full h-96 flex flex-col items-center justify-center grayscale opacity-10">
                                <Calendar size={120} strokeWidth={1} />
                                <p className="font-black uppercase tracking-[0.4em] mt-6">No {filterType !== 'ALL' ? filterType : ''} Bookings for this date</p>
                            </div>
                        ) : filteredBookings.map(b => (
                            <BookingCard key={b.id} booking={b} onCancel={handleCancelBooking} onEdit={handleEditBooking} />
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showNewBooking && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowNewBooking(false); setCurrentStep(1); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-6xl rounded-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]">

                            <div className="py-2 px-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${activeTab === 'DINE' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-blue-600 shadow-blue-100'}`}>
                                        {activeTab === 'DINE' ? <Armchair size={24} /> : <Bike size={24} />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                            {editingBooking ? 'Edit' : 'New'} {activeTab === 'DINE' ? 'Reservation' : 'Booking'}
                                        </h2>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {currentStep === 1 && (activeTab === 'DINE' ? 'Select Your Table' : 'Add Items to Order')}
                                            {currentStep === 2 && 'Customer & Reservation Details'}
                                            {currentStep === 3 && 'Advance Payment (Optional)'}
                                        </p>
                                    </div>
                                </div>

                                {/* Step Progress Indicator */}
                                <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                    {[1, 2, 3].map(s => (
                                        <div key={s} className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${currentStep === s ? (activeTab === 'DINE' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white') : (currentStep > s ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200')}`}>
                                                {currentStep > s ? <CheckCircle2 size={12} /> : s}
                                            </div>
                                            {s < 3 && <div className={`w-8 h-[2px] rounded-full ${currentStep > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => { setShowNewBooking(false); clearForm(); }} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
                                {activeTab === 'DINE' ? (
                                    <DineInFlow
                                        customers={customers}
                                        setCustomers={setCustomers}
                                        currentStep={currentStep}
                                        setCurrentStep={setCurrentStep}
                                        bookingDate={bookingDate} setBookingDate={setBookingDate}
                                        bookingTime={bookingTime} setBookingTime={setBookingTime}
                                        reminderTime={reminderTime} setReminderTime={setReminderTime}
                                        pax={pax} setPax={setPax}
                                        advanceAmount={advanceAmount} setAdvanceAmount={setAdvanceAmount}
                                        selectedTableId={selectedTableId} setSelectedTableId={setSelectedTableId}
                                        remarks={remarks} setRemarks={setRemarks}
                                        vacantTables={vacantTables}
                                        onSave={handleSaveDineBooking}
                                        onCompletePayment={() => setShowPayment(true)}
                                        newCustomer={newCustomer}
                                        setNewCustomer={setNewCustomer}
                                        isProcessing={isProcessing}
                                        isLoading={isLoading}
                                    />
                                ) : (
                                    <DeliveryFlow
                                        customers={customers}
                                        setCustomers={setCustomers}
                                        currentStep={currentStep}
                                        setCurrentStep={setCurrentStep}
                                        bookingDate={bookingDate} setBookingDate={setBookingDate}
                                        bookingTime={bookingTime} setBookingTime={setBookingTime}
                                        reminderTime={reminderTime} setReminderTime={setReminderTime}
                                        cart={cart} setCart={setCart}
                                        remarks={remarks} setRemarks={setRemarks}
                                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                                        activeGroup={activeGroup} setActiveGroup={setActiveGroup}
                                        deliveryDiscount={deliveryDiscount} setDeliveryDiscount={setDeliveryDiscount}
                                        advanceAmount={advanceAmount} setAdvanceAmount={setAdvanceAmount}
                                        onSaveDelivery={async (isDirectSave) => {
                                            if (!newCustomer.name || !newCustomer.mobile || !newCustomer.address) {
                                                return notify('All customer details (Name, Mobile, Address) are mandatory', 'error');
                                            }
                                            if (cart.length === 0) return notify('Please add items to the booking', 'error');

                                            setIsProcessing(true);
                                            try {
                                                const customerInfo = await ensureCustomer();
                                                const booking = {
                                                    id: editingBooking?.id || ("BKG_DE_" + Date.now()),
                                                    type: 'DELIVERY',
                                                    status: editingBooking?.status || 'CONFIRMED',
                                                    customerId: customerInfo.id,
                                                    customerName: customerInfo.name,
                                                    customerMobile: customerInfo.mobile,
                                                    customerAddress: customerInfo.address,
                                                    customerRegNo: customerInfo.regNumber,
                                                    bookingTime: `${bookingDate}T${bookingTime}:00`,
                                                    reminderTime: `${bookingDate}T${reminderTime}:00`,
                                                    createdTime: editingBooking?.createdTime || new Date().toISOString(),
                                                    items: cart,
                                                    remarks,
                                                    subTotal: subTotal,
                                                    discount: parseFloat(deliveryDiscount || 0),
                                                    totalAmount: totalAmount,
                                                    advancePaid: editingBooking?.advancePaid || 0,
                                                    paymentDetails: editingBooking?.paymentDetails || [],
                                                    isNewCustomer: !selectedCustomer
                                                };

                                                if (isDirectSave) {
                                                    await saveBooking(booking);
                                                    notify('Delivery Booking Scheduled!', 'success');
                                                    setShowNewBooking(false);
                                                    setCurrentStep(1);
                                                    loadBookings();
                                                    loadCustomers();
                                                    clearForm();
                                                } else {
                                                    setTempBookingData(booking);
                                                    setCurrentStep(3);
                                                }
                                            } catch (e) {
                                                notify('Failed to save delivery booking: ' + e.message, 'error');
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }}
                                        onCompletePayment={() => setShowPayment(true)}
                                        newCustomer={newCustomer}
                                        setNewCustomer={setNewCustomer}
                                        subTotal={subTotal}
                                        totalAmount={totalAmount}
                                        isProcessing={isProcessing}
                                        isLoading={isLoading}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <MultiPaymentsModal
                isOpen={showPayment}
                total={advanceAmount > 0 ? advanceAmount : 0}
                multiPayments={multiPayments}
                setMultiPayments={setMultiPayments}
                notify={notify}
                onClose={() => setShowPayment(false)}
                onProcess={handlePaymentSuccess}
                title="Advance Deposit"
            />

            <AuthorizerModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                onAuthorize={confirmCancel}
                permissionKey="cancelOrder"
                title="Cancellation Authorization"
                message="Please authorize to cancel this booking."
            />
        </div>
    );
};

const BookingCard = ({ booking, onCancel, onEdit }) => {
    const isDine = booking.type === 'DINE';
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12 ${isDine ? 'bg-indigo-600' : 'bg-blue-600'}`} />

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDine ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isDine ? <Armchair size={20} /> : <Bike size={20} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{isDine ? 'Reservation' : 'Booking'}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">{booking.id}</span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Customer Details</span>
                    <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{booking.customerName}</h4>
                        <span className="text-[10px] font-bold text-slate-400">({booking.customerMobile})</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date & Time</span>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-500">
                                <Calendar size={10} className="text-indigo-500" />
                                <span className="text-[10px] uppercase">{new Date(booking.bookingTime).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                                <Clock size={12} className="text-indigo-500" />
                                <span className="text-xs">{new Date(booking.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                    {isDine && (
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Table</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                                <Tag size={12} className="text-indigo-500" />
                                <span className="text-xs">#{booking.tableId}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Advance Status</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black font-mono ${booking.advancePaid > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                ₹{(booking.advancePaid || 0).toFixed(2)}
                            </span>
                            {booking.advancePaid > 0 && <Check size={12} className="text-emerald-500" strokeWidth={4} />}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(booking)} className="w-9 h-9 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all">
                            <FileText size={16} />
                        </button>
                        <button onClick={() => onCancel(booking.id)} className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const DineInFlow = ({ customers, setCustomers, currentStep, setCurrentStep, bookingDate, setBookingDate, bookingTime, setBookingTime, reminderTime, setReminderTime, pax, setPax, advanceAmount, setAdvanceAmount, selectedTableId, setSelectedTableId, remarks, setRemarks, vacantTables, onSave, onCompletePayment, newCustomer, setNewCustomer, isProcessing, isLoading }) => {
    const { setSelectedCustomer, selectedCustomer, notify } = useApp();
    const [custSearch, setCustSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const filteredCusts = useMemo(() => {
        const query = custSearch?.toLowerCase().trim();
        if (!query || !customers) return [];
        return customers
            .filter(c => {
                return (
                    c.name?.toLowerCase().includes(query) ||
                    c.mobile?.includes(query) ||
                    c.regNumber?.toLowerCase().includes(query)
                );
            })
            .slice(0, 5);
    }, [custSearch, customers]);

    const handleSaveDirect = async () => {
        onSave(true);
    };

    const handleProceedToPayment = () => {
        onSave(false);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar p-5">
                {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Select Available Table</h3>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {vacantTables.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTableId(t.id)}
                                    className={`h-28 rounded-[2rem] flex flex-col items-center justify-center transition-all border-2 ${selectedTableId === t.id ? 'bg-indigo-600 text-white shadow-xl scale-105 border-indigo-700' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'}`}
                                >
                                    <Armchair size={24} className={selectedTableId === t.id ? 'text-indigo-200' : 'text-slate-200'} strokeWidth={1.5} />
                                    <span className="text-xs font-black uppercase mt-2">{t.id}</span>
                                    <span className="text-[10px] font-bold opacity-60">CAP: {t.capacity}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Customer Information</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    {/* Integrated Customer Search via Name/Mobile */}

                                    <div>
                                        <div className="grid gap-2">
                                            <div className="space-y-1 relative">
                                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Guest Name *</label>
                                                <input
                                                    type="text"
                                                    value={newCustomer.name}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNewCustomer({ ...newCustomer, name: val });
                                                        setCustSearch(val);
                                                        setShowSuggestions(true);
                                                    }}
                                                    placeholder="Guest Name"
                                                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black focus:bg-white focus:border-indigo-300 transition-all"
                                                />
                                                <AnimatePresence>
                                                    {showSuggestions && custSearch && (
                                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                                                            {filteredCusts.length > 0 ? filteredCusts.map(c => (
                                                                <button key={c.id} onClick={() => {
                                                                    setSelectedCustomer(c);
                                                                    setNewCustomer({ name: c.name, mobile: c.mobile, address: c.address || '', regNumber: c.regNumber || '' });
                                                                    setShowSuggestions(false);
                                                                    setCustSearch('');
                                                                }} className="w-full p-3 flex justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all text-left">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-slate-800 text-[10px] uppercase">{c.name}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400">{c.mobile}</span>
                                                                    </div>
                                                                </button>
                                                            )) : null}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="space-y-1 relative">
                                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Mobile Number *</label>
                                                <input
                                                    type="text"
                                                    value={newCustomer.mobile}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNewCustomer({ ...newCustomer, mobile: val });
                                                        setCustSearch(val);
                                                        setShowSuggestions(true);
                                                    }}
                                                    placeholder="Mobile Number"
                                                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black focus:bg-white focus:border-indigo-300 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Address *</label>
                                                <textarea
                                                    rows={2}
                                                    value={newCustomer.address}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                    placeholder="Address"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black focus:bg-white focus:border-indigo-300 transition-all resize-none outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Reg Number *</label>
                                                <input
                                                    type="text"
                                                    value={newCustomer.regNumber}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, regNumber: e.target.value })}
                                                    placeholder="Reg Number"
                                                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black focus:bg-white focus:border-indigo-300 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Special Remarks</h3>
                                </div>
                                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any special requests or notes..." className="w-full h-25 bg-white border border-slate-100 rounded-2xl p-5 text-xs font-black text-slate-700 shadow-sm focus:border-indigo-300 transition-all resize-none outline-none" />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Timing & Guests</h3>
                                </div>
                                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reservation Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full h-12 bg-slate-50 rounded-xl pl-12 pr-4 text-xs font-black outline-none border border-slate-100 focus:border-indigo-300" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Arrival Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full h-12 bg-slate-50 rounded-xl pl-12 pr-4 text-xs font-black outline-none border border-slate-100 focus:border-indigo-300" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Guest Count (Pax)</label>
                                            <div className="flex h-12 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                                <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-14 h-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all">-</button>
                                                <div className="flex-1 flex items-center justify-center gap-2">
                                                    <Users size={16} className="text-slate-300" />
                                                    <input type="number" value={pax} onChange={(e) => setPax(parseInt(e.target.value) || 1)} className="bg-transparent text-center font-black text-slate-700 outline-none w-10" />
                                                </div>
                                                <button onClick={() => setPax(pax + 1)} className="w-14 h-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all">+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reminder Time</label>
                                            <div className="relative">
                                                <Bell className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full h-12 bg-slate-50 rounded-xl pl-12 pr-4 text-xs font-black outline-none border border-slate-100 focus:border-indigo-300 uppercase" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 border-dashed">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                                        <Tag size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-indigo-900 uppercase">Selected Table: #{selectedTableId}</h4>
                                        <p className="text-[10px] text-indigo-400 font-bold mt-1">Ground Floor • {pax} Guests • {bookingDate} @ {bookingTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto space-y-8 py-3">
                        <div className="text-center space-y-2">
                            <div className="w-18 h-18 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                                <Wallet size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Advance Payment</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional deposit to secure the reservation</p>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">Entry Advance Amount (₹)</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={advanceAmount}
                                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full text-3xl font-black text-center text-indigo-600 bg-slate-50 rounded-2xl h-16 outline-none placeholder:text-slate-200 border border-slate-100 focus:bg-white focus:border-indigo-300 transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Reservation ID</span>
                                    <span className="text-xs font-bold text-slate-600">PENDING</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Customer</span>
                                    <span className="text-xs font-bold text-slate-600">{selectedCustomer?.name || newCustomer.name}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                <button
                    onClick={() => currentStep === 1 ? setCurrentStep(1) : setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Previous
                </button>

                <div className="flex gap-4">
                    {currentStep === 1 && (
                        <button
                            onClick={() => selectedTableId ? setCurrentStep(2) : notify('Please select a table', 'error')}
                            className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2"
                        >
                            Next Details <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    )}
                    {currentStep === 2 && (
                        <>
                            <button
                                onClick={handleSaveDirect}
                                disabled={isProcessing}
                                className="h-14 px-10 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? 'Saving...' : 'Save without Advance'}
                            </button>
                            <button
                                onClick={handleProceedToPayment}
                                disabled={isProcessing}
                                className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                Proceed to Payment <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </>
                    )}
                    {currentStep === 3 && (
                        <button
                            onClick={() => advanceAmount > 0 ? onCompletePayment() : onSave(true)}
                            disabled={isProcessing}
                            className="h-14 px-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} strokeWidth={3} /> {isProcessing ? 'Saving...' : (advanceAmount > 0 ? 'Collect Payment' : 'Complete Booking')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const DeliveryFlow = ({ customers, setCustomers, currentStep, setCurrentStep, bookingDate, setBookingDate, bookingTime, setBookingTime, reminderTime, setReminderTime, cart, setCart, remarks, setRemarks, searchTerm, setSearchTerm, activeGroup, setActiveGroup, deliveryDiscount, setDeliveryDiscount, advanceAmount, setAdvanceAmount, onSaveDelivery, onCompletePayment, newCustomer, setNewCustomer, subTotal, totalAmount, isProcessing, isLoading }) => {
    const { setSelectedCustomer, selectedCustomer, notify } = useApp();
    const [custSearch, setCustSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredCusts = useMemo(() => {
        const query = custSearch?.toLowerCase().trim();
        if (!query || !customers) return [];
        return customers
            .filter(c => {
                return (
                    c?.name?.toLowerCase().includes(query) ||
                    c?.mobile?.includes(query) ||
                    c?.regNumber?.toLowerCase().includes(query)
                );
            })
            .slice(0, 5);
    }, [custSearch, customers]);

    const filteredItems = useMemo(() => {
        let items = itemsDb;
        if (activeGroup) items = items.filter(i => i.groupId === activeGroup);
        if (searchTerm) items = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return items;
    }, [activeGroup, searchTerm]);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...item, qty: 1, isSaved: false }];
        });
        notify(`${item.name} added to booking`, 'success');
    };

    // Totals are now passed as props from parent

    const handleSaveDirect = async () => {
        if (!selectedCustomer && (!newCustomer.name || !newCustomer.mobile)) {
            return notify('Please select or enter customer details', 'error');
        }
        if (cart.length === 0) return notify('Please add items to the booking', 'error');

        onSaveDelivery(true); // true for direct save
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex overflow-hidden">
                        {/* Left: Cart Summary (KOT Style) */}
                        <div className="w-[380px] border-r border-slate-100 bg-white flex flex-col overflow-hidden shrink-0">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Order Items</h3>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cart.length} Products Added</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-200 grayscale opacity-40">
                                        <ShoppingCart size={60} strokeWidth={1} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-center">Your basket <br />is empty</p>
                                    </div>
                                ) : cart.map(item => (
                                    <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={item.id} className="flex justify-between items-center group p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-black text-slate-700 uppercase truncate">{item.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-slate-400">{item.qty} x ₹{item.price}</span>
                                                {item.type && <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md tracking-widest">{item.type}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[11px] font-black text-slate-800">₹{(item.qty * item.price).toFixed(2)}</span>
                                            <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="w-8 h-8 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-3 shrink-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                                    <span className="text-sm font-black text-slate-700">₹{subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Discount</span>
                                    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-2 py-1 shadow-sm">
                                        <Tag size={12} className="text-rose-400" />
                                        <input
                                            type="number"
                                            value={deliveryDiscount}
                                            onChange={(e) => setDeliveryDiscount(parseFloat(e.target.value) || 0)}
                                            className="w-16 h-6 text-right text-[11px] font-black text-rose-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Payable Total</span>
                                    <span className="text-2xl font-black text-slate-800 tracking-tight">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Item Selection */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Categories */}
                            <div className="p-6 bg-white border-b border-slate-50 shrink-0 shadow-sm z-10">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {groupsDb.map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => setActiveGroup(g.id)}
                                            className={`px-6 h-12 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.15em] whitespace-nowrap transition-all border-2 ${activeGroup === g.id ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                        >
                                            {g.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Items Grid */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50/20">
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:scale-[1.02] transition-all text-left flex flex-col group relative overflow-hidden h-36"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 blur-2xl opacity-0 group-hover:opacity-100 transition-all" />
                                            <div className="flex-1 flex flex-col justify-between relative">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-[12px] font-black text-slate-800 uppercase leading-snug group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                                                    {item.type === 'COMBO_ITEM' && <Layers size={14} className="text-amber-400 shrink-0" />}
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[13px] font-black text-slate-400 group-hover:text-slate-900 transition-all">₹{item.price}</span>
                                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                        <Plus size={16} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Customer Information</h3>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                                        {/* Integrated Customer Search via Name/Mobile */}

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Or Enter New Details</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1 relative">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Guest Name *</label>
                                                    <input
                                                        type="text"
                                                        value={newCustomer.name}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setNewCustomer({ ...newCustomer, name: val });
                                                            setCustSearch(val);
                                                            setShowSuggestions(true);
                                                        }}
                                                        placeholder="Guest Name"
                                                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black focus:bg-white focus:border-blue-300 transition-all"
                                                    />
                                                    <AnimatePresence>
                                                        {showSuggestions && custSearch && (
                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                                                                {filteredCusts.length > 0 ? filteredCusts.map(c => (
                                                                    <button key={c.id} onClick={() => {
                                                                        setSelectedCustomer(c);
                                                                        setNewCustomer({ name: c.name, mobile: c.mobile, address: c.address || '', regNumber: c.regNumber || '' });
                                                                        setShowSuggestions(false);
                                                                        setCustSearch('');
                                                                    }} className="w-full p-3 flex justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all text-left">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-slate-800 text-[10px] uppercase">{c.name}</span>
                                                                            <span className="text-[9px] font-bold text-slate-400">{c.mobile}</span>
                                                                        </div>
                                                                    </button>
                                                                )) : null}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <div className="space-y-1 relative">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Mobile Number *</label>
                                                    <input
                                                        type="text"
                                                        value={newCustomer.mobile}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setNewCustomer({ ...newCustomer, mobile: val });
                                                            setCustSearch(val);
                                                            setShowSuggestions(true);
                                                        }}
                                                        placeholder="Mobile Number"
                                                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black focus:bg-white focus:border-blue-300 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1 sm:col-span-2">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Address *</label>
                                                    <textarea
                                                        rows={2}
                                                        value={newCustomer.address}
                                                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                        placeholder="Address"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black focus:bg-white focus:border-blue-300 transition-all resize-none outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1 sm:col-span-2">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Reg Number *</label>
                                                    <input
                                                        type="text"
                                                        value={newCustomer.regNumber}
                                                        onChange={(e) => setNewCustomer({ ...newCustomer, regNumber: e.target.value })}
                                                        placeholder="Reg Number"
                                                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-black focus:bg-white focus:border-blue-300 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                        <h3 className="text-[11px] font-black text-slate-800 upperse tracking-[0.2em]">Booking Remarks</h3>
                                    </div>
                                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any special requests or notes..." className="w-full h-32 bg-white border border-slate-100 rounded-[2rem] p-5 text-xs font-black text-slate-700 shadow-sm focus:border-blue-300 transition-all resize-none outline-none" />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Timing & Reminders</h3>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Delivery Time</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                    <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full h-12 bg-slate-50 rounded-xl pl-12 pr-4 text-xs font-black outline-none border border-slate-100 focus:border-blue-300" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reminder Time</label>
                                                <div className="relative">
                                                    <Bell className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                    <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full h-12 bg-slate-50 rounded-xl pl-12 pr-4 text-xs font-black outline-none border border-slate-100 focus:border-rose-300" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Delivery Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full h-12 bg-slate-50 rounded-xl pl-12 pr-4 text-xs font-black outline-none border border-slate-100 focus:border-blue-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 border-dashed">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-blue-900 uppercase">Order Summary</h4>
                                            <p className="text-[10px] text-blue-400 font-bold mt-1">{cart.length} Items • Total Payable: ₹{totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto space-y-8 py-12">
                        <div className="text-center space-y-2">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Wallet size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Advance Payment</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Optional deposit to secure the delivery booking</p>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">Entry Advance Amount (₹)</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={advanceAmount}
                                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full text-5xl font-black text-center text-blue-600 outline-none placeholder:text-slate-100"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Booking Subtotal</span>
                                    <span className="text-xs font-bold text-slate-600">₹{subTotal.toFixed(2)}</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Customer</span>
                                    <span className="text-xs font-bold text-slate-600">{selectedCustomer?.name || newCustomer.name || 'GUEST'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                <button
                    onClick={() => currentStep === 1 ? setCurrentStep(1) : setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Previous
                </button>

                <div className="flex gap-4">
                    {currentStep === 1 && (
                        <button
                            onClick={() => cart.length > 0 ? setCurrentStep(2) : notify('Please add items to order', 'error')}
                            className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2"
                        >
                            Review Details <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    )}
                    {currentStep === 2 && (
                        <>
                            <button
                                onClick={handleSaveDirect}
                                disabled={isProcessing}
                                className="h-14 px-10 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? 'Saving...' : 'Save without Advance'}
                            </button>
                            <button
                                onClick={() => onSaveDelivery(false)}
                                disabled={isProcessing}
                                className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                Proceed to Payment <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </>
                    )}
                    {currentStep === 3 && (
                        <button
                            onClick={() => advanceAmount > 0 ? onCompletePayment() : handleSaveDirect()}
                            disabled={isProcessing}
                            className="h-14 px-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} strokeWidth={3} /> {isProcessing ? 'Saving...' : (advanceAmount > 0 ? 'Collect Payment' : 'Complete Booking')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingsPage;
