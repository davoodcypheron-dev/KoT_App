
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ConfigPage from './pages/ConfigPage';
import TablesPage from './pages/TablesPage';
import KotPage from './pages/KotPage';
import SoldOutPage from './pages/SoldOutPage';
import OrdersListPage from './pages/OrdersListPage';
import DeliveryDashboard from './pages/DeliveryDashboard';
import TableChangePage from './pages/TableChangePage';
import TableMergePage from './pages/TableMergePage';
import ProductChoiceMaster from './pages/ProductChoiceMaster';
import AddonMaster from './pages/AddonMaster';
import ItemAddonMaster from './pages/ItemAddonMaster';
import OrderHistoryPage from './pages/OrderHistoryPage';
import BookingsPage from './pages/BookingsPage';
import BookingNotification from './components/modals/BookingNotification';
import { getAllBookings, updateBookingStatus, BOOKINGS_STORE, TABLES_STORE, ORDERS_STORE, getAllFromStore, saveBooking } from './data/idb';

import LoginPage from './pages/LoginPage';
import { AnimatePresence, motion } from 'framer-motion';
import { initAppDb } from './data/dbInitializer';
import {
  Bike, ShoppingCart, List, RefreshCw, QrCode, Armchair, Calendar, AlertCircle,
  Plus, Search, Shuffle, ShoppingBag, CheckCircle
} from 'lucide-react';
import { initialConfig } from './data/mockDb';
import DeliverySummaryPage from './pages/DeliverySummaryPage';

const TopPanel = ({ onRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config, setConfig, clearCurrentOrder, notify } = useApp();
  const [billNo, setBillNo] = useState('');
  const [kotNo, setKotNo] = useState('');
  const qrInputRef = React.useRef(null);

  const handleBillSearch = (e) => {
    if (e.key === 'Enter' && billNo) {
      notify(`Opening Bill #${billNo}`, 'success');
      navigate('/kot');
      setBillNo('');
    }
  };

  const handleKotSearch = (e) => {
    if (e.key === 'Enter' && kotNo) {
      notify(`Opening KOT #${kotNo}`, 'success');
      navigate('/kot');
      setKotNo('');
    }
  };

  const handleNewOrder = () => {
    clearCurrentOrder();
    setConfig(prev => ({ ...prev, defaultKotType: initialConfig.defaultKotType }));
    navigate('/tables');
  };

  const handleTakeaway = () => {
    clearCurrentOrder();
    setConfig(prev => ({ ...prev, defaultKotType: 'TA' }));
    navigate('/kot');
  };

  const handleDelivery = () => {
    clearCurrentOrder();
    setConfig(prev => ({ ...prev, defaultKotType: 'DE' }));
    navigate('/kot');
  };

  const handleDineIn = () => {
    clearCurrentOrder();
    setConfig(prev => ({ ...prev, defaultKotType: 'DI' }));
    navigate('/tables');
  };

  const releaseSelection = () => {
    setConfig(prev => ({ ...prev, defaultKotType: null }));
  };

  const handleQrFocus = () => {
    if (qrInputRef.current) {
      qrInputRef.current.value = '';
      qrInputRef.current.focus();
      notify('Scanner Focused', 'success');
    }
  };

  return (
    <div className="h-16 bg-white flex items-center px-4 gap-2 shrink-0 shadow-sm z-[150] border-b border-slate-200">
      {/* Scanner Hidden Input */}
      <input
        ref={qrInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (val) {
              notify(`Scanned: ${val}`, 'success');
              e.target.value = '';
            }
          }
        }}
      />

      {/* New Button */}
      <button onClick={handleNewOrder} className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-m shadow-emerald-100">
        <Plus size={18} strokeWidth={3} /> New
      </button>

      {/* Bill & KOT Search */}
      <div className="flex items-center gap-1.5 ml-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            placeholder="Bill No"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value)}
            onKeyDown={handleBillSearch}
            className="w-24 h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-[10px] font-black text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-400 shadow-inner"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            placeholder="KOT No"
            value={kotNo}
            onChange={(e) => setKotNo(e.target.value)}
            onKeyDown={handleKotSearch}
            className="w-28 h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-[10px] font-black text-slate-700 outline-none focus:border-blue-400 transition-all placeholder:text-slate-400 shadow-inner"
          />
        </div>
      </div>

      <div className="h-8 w-[1px] bg-slate-200 mx-1" />

      {/* Management Icons */}
      <div className="flex gap-1">
        <button
          onClick={() => { releaseSelection(); navigate('/order-history'); }}
          className={`h-11 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${location.pathname === '/order-history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Search size={16} /> Find
        </button>
        <button
          onClick={() => { releaseSelection(); navigate('/soldout'); }}
          className={`h-11 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${location.pathname === '/soldout' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <ShoppingBag size={16} /> Sold Out
        </button>
        <button
          onClick={() => { releaseSelection(); navigate('/table-change'); }}
          className={`h-11 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${location.pathname === '/table-change' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Shuffle size={16} /> Table Change
        </button>
        <button
          onClick={() => { releaseSelection(); navigate('/table-merge'); }}
          className={`h-11 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${location.pathname === '/table-merge' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <List size={16} /> Table Merge
        </button>
        <button
          onClick={() => { releaseSelection(); navigate('/bookings'); }}
          className={`h-11 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider ${location.pathname === '/bookings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Calendar size={16} /> Bookings
        </button>
      </div>

      <div className="flex-1" />

      {/* Order Type Controls */}
      <div className="flex gap-1 h-11 items-center">
        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
        <button onClick={handleQrFocus} className="h-11 w-11 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all group border border-slate-100">
          <QrCode size={20} className="group-active:scale-90" />
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2 mr-3" />

        <button
          onClick={handleDineIn}
          className={`px-5 h-full rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all border-2 ${config.defaultKotType === 'DI' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          <Armchair size={16} /> Dine In
        </button>
        <button
          onClick={handleTakeaway}
          className={`px-5 h-full rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all border-2 ${config.defaultKotType === 'TA' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          <ShoppingCart size={16} /> Take Away
        </button>
        <button
          onClick={handleDelivery}
          className={`px-5 h-full rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all border-2 ${config.defaultKotType === 'DE' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          <Bike size={16} /> Delivery
        </button>
      </div>

      <div className="h-8 w-[1px] bg-slate-200 mx-1" />

      {/* Refresh */}
      <button
        onClick={() => { releaseSelection(); onRefresh(); }}
        className="w-11 h-11 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-slate-100"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

const SyncLoader = ({ isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full shadow-lg"
          />
          <RefreshCw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" size={24} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Syncing...</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Please Wait While We Update</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const NotificationOverlay = () => {
  const { notifications } = useApp();
  return (
    <AnimatePresence>
      {notifications.map(n => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed bottom-8 right-8 z-[1000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border min-w-[300px] ${n.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-white border-slate-100 text-slate-800'
            }`}
        >
          {n.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle className="text-emerald-500" size={20} />}
          <span className="font-black text-sm">{n.msg}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

const Layout = ({ children, onRefresh, isSyncing }) => {
  const { config } = useApp();
  const location = useLocation();
  const hideNavPaths = ['/product-choice-master', '/addon-master', '/item-addon-master', '/configpage', '/login'];
  const shouldHideNav = hideNavPaths.includes(location.pathname.toLowerCase());

  if (!config.activeUserId && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-screen bg-[#fdf2f2]">
      {!shouldHideNav && <TopPanel onRefresh={onRefresh} />}
      <SyncLoader isVisible={isSyncing} />
      <NotificationOverlay />
      {/* <BookingNotification /> */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { config, clearCurrentOrder } = useApp();

  React.useEffect(() => {
    // Ensure fresh start on root load
    clearCurrentOrder();
  }, []);

  if (!config.activeUserId) {
    return <Navigate to="/login" replace />;
  }
  if (config.defaultKotType === 'DI') {
    return <Navigate to="/tables" replace />;
  }
  if (config.defaultKotType === 'TA' || config.defaultKotType === 'DE') {
    return <Navigate to="/kot" replace />;
  }
  return <Navigate to="/tables" replace />;
};

const App = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  React.useEffect(() => {
    initAppDb()
      .then(() => setIsDbLoaded(true))
      .catch(e => {
        console.error("Database initialization failed", e);
        setIsDbLoaded(true);
      });
  }, []);

  // Background Booking Reminder Polling
  React.useEffect(() => {
    if (!isDbLoaded) return;

    const checkReminders = async () => {
      try {
        const [bookings, tables, orders] = await Promise.all([
          getAllBookings(),
          getAllFromStore(TABLES_STORE),
          getAllFromStore(ORDERS_STORE)
        ]);
        const now = new Date();

        for (const b of bookings) {
          // 30s Dismissal Logic: If CONFIRMED but dismissed recently, wait 30s before REACHED again
          const lastDismissed = b.lastDismissedTime ? new Date(b.lastDismissedTime) : null;
          const wasRecentlyDismissed = lastDismissed && (now - lastDismissed < 30000);

          if (b.status === 'CONFIRMED' && !wasRecentlyDismissed) {
            // Delivery Reminder logic
            if (b.type === 'DELIVERY' && b.reminderTime) {
              const rTime = new Date(b.reminderTime);
              if (now >= rTime) {
                await updateBookingStatus(b.id, 'REACHED');
              }
            }

            // Reservation Reminder logic
            if (b.type === 'DINE' && (b.reminderTime || b.bookingTime)) {
              const bTime = new Date(b.reminderTime || b.bookingTime);
              if (now >= bTime) {
                // Check table occupancy
                const table = tables.find(t => t.id === b.tableId);
                const activeOrder = table?.activeOrderId ? orders.find(o => o.id === table.activeOrderId) : null;

                // Trigger if table is vacant OR occupied by different customer
                const isOccupiedByDifferentCustomer = activeOrder && activeOrder.customerId !== b.customerId;
                if (!activeOrder || isOccupiedByDifferentCustomer) {
                  await updateBookingStatus(b.id, 'REACHED');
                }
              }
            }
          }

          // Auto-Cancellation logic (2 hours limit)
          if (b.status === 'REACHED') {
            const rTime = new Date(b.reminderTime || b.bookingTime);
            const diffMs = now - rTime;
            const diffHrs = diffMs / (1000 * 60 * 60);

            if (diffHrs > 2) {
              await updateBookingStatus(b.id, 'CANCELLED');
              console.log(`Auto-cancelled booking ${b.id} due to inactivity (>2hrs)`);
            }
          }
        }
      } catch (e) {
        console.error("Reminder check failed", e);
      }
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isDbLoaded]);

  const handleRefresh = () => {
    setIsSyncing(true);
    // Simulate sync then reload
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  };

  if (!isDbLoaded) {
    return <div className="h-screen w-screen bg-[#fdf2f2] flex items-center justify-center"><SyncLoader isVisible={true} /></div>;
  }

  return (
    <AppProvider>
      <Router>
        <Layout onRefresh={handleRefresh} isSyncing={isSyncing}>
          <Routes>
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/kot" element={<KotPage />} />
            <Route path="/soldout" element={<SoldOutPage />} />
            <Route path="/orders" element={<OrdersListPage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />

            <Route path="/delivery-summary" element={<DeliveryDashboard />} />
            <Route path="/delivery-report" element={<DeliverySummaryPage />} />
            <Route path="/table-change" element={<TableChangePage />} />
            <Route path="/table-merge" element={<TableMergePage />} />
            <Route path="/product-choice-master" element={<ProductChoiceMaster />} />
            <Route path="/addon-master" element={<AddonMaster />} />
            <Route path="/item-addon-master" element={<ItemAddonMaster />} />
            <Route path="/configPage" element={<ConfigPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};

export default App;
