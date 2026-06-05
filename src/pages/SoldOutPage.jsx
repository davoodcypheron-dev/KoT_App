
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { itemsDb, unitsDb } from '../data/mockDb';
import { getSoldOutTracking, saveToStore, APP_META_STORE, getAllProducts } from '../data/idb';
import { ShoppingBag, ArrowLeft, Search, CheckCircle, XCircle, AlertCircle, RefreshCcw, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QtyModal from '../components/modals/QtyModal';

const SoldOutPage = () => {
  const { notify } = useApp();
  const navigate = useNavigate();

  // Tracked items: { id, name, qty, isSoldOut }
  const [trackedItems, setTrackedItems] = useState([]);

  const [dbProducts, setDbProducts] = useState([]);

  React.useEffect(() => {
    const fetchSoldOut = async () => {
       const data = await getSoldOutTracking();
       setTrackedItems(data || []);
       const products = await getAllProducts();
       setDbProducts(products || []);
    };
    fetchSoldOut();
  }, []);

  const updateTrackedInIDB = async (newArr) => {
    setTrackedItems(newArr);
    await saveToStore(APP_META_STORE, { key: 'sold_out_items', value: newArr });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [showQtyModal, setShowQtyModal] = useState(null);
  const [tempQty, setTempQty] = useState('');

  const allAvailableItems = useMemo(() => {
    const merged = [
      ...itemsDb.map(i => ({ ...i, type: 'ITEM' })),
      ...dbProducts.map(p => ({ ...p, id: p.id, name: p.displayName, type: 'COMBO' }))
    ];
    return merged;
  }, [dbProducts]);

  const filteredItems = useMemo(() => {
    if (searchTerm.length >= 3) {
      return allAvailableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return allAvailableItems;
  }, [searchTerm, allAvailableItems]);

  const handleKeypadPress = (val) => {
    if (val === 'C') {
      setTempQty('');
    } else if (val === 'DEL') {
      setTempQty(prev => prev.slice(0, -1));
    } else {
      if (tempQty.length < 4) setTempQty(prev => prev + val);
    }
  };

  const handleUpdateClick = async () => {
    const qty = tempQty === '' ? 0 : parseInt(tempQty);
    let newArr;

    const exists = trackedItems.find(i => i.id === showQtyModal.id);
    if (exists) {
      newArr = trackedItems.map(i => i.id === showQtyModal.id ? { ...i, qty, isSoldOut: qty === 0 } : i);
    } else {
      newArr = [...trackedItems, {
        id: showQtyModal.id,
        name: showQtyModal.name,
        qty: qty,
        isSoldOut: qty === 0
      }];
    }
    
    await updateTrackedInIDB(newArr);

    notify(`${showQtyModal.name} stock updated`, 'success');
    setShowQtyModal(null);
    setSearchTerm('');
    setTempQty('');
  };

  const resetAll = async () => {
    await updateTrackedInIDB([]);
    notify('All stock tracking cleared', 'success');
  };

  const handleItemClick = (item) => {
    const tracked = trackedItems.find(ti => ti.id === item.id);
    setShowQtyModal(item);
    setTempQty(tracked ? tracked.qty.toString() : '');
  };

  const removeItemTracking = async (itemId) => {
    const newArr = trackedItems.filter(ti => ti.id !== itemId);
    await updateTrackedInIDB(newArr);
    notify('Item reset to Available', 'info');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fff8e7] overflow-hidden h-screen">
      {/* Top Navigation Panel */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 shadow-sm relative z-[100]">

        <h1 className="text-lg font-black text-slate-800 tracking-tight mr-4">Item Sold Out</h1>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search all items (min 3 chars)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={resetAll}
            className="h-11 px-6 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 hover:bg-slate-900"
          >
            <RefreshCcw size={18} /> Reset All
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
            <ShoppingBag size={120} strokeWidth={1} />
            <div className="text-center">
              <p className="font-black text-2xl uppercase tracking-[0.2em] leading-none">
                {searchTerm.length >= 3 ? "No matching items" : "No items found"}
              </p>
              <p className="font-bold text-sm mt-4 uppercase tracking-widest">
                {searchTerm.length >= 3 ? "Try a different search term" : "Check your database connection"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 pb-20">
            {filteredItems.map((item) => {
              const tracked = trackedItems.find(ti => ti.id === item.id);
              const isSoldOut = tracked?.isSoldOut;
              const unit = unitsDb.find(u => u.id === item.unitId);
              
              return (
                <motion.div
                  layout
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`relative h-40 p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                      tracked 
                        ? (isSoldOut ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-amber-50 border-amber-200 shadow-sm')
                        : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'
                    }`}
                >
                  {/* Reset Button (Only if tracked) */}
                  {tracked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItemTracking(item.id);
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg active:scale-90 z-20"
                      title="Reset to Available"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}

                  <div className="flex-1">
                    <h3 className="font-black text-[11px] text-slate-800 leading-tight uppercase line-clamp-2">{item.name}</h3>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {item.id}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${tracked ? (isSoldOut ? 'text-rose-600' : 'text-amber-600') : 'text-slate-400'}`}>
                        {isSoldOut ? 'Sold Out' : (tracked ? 'Limited Stock' : 'Available')}
                      </span>
                    </div>

                    {tracked && !isSoldOut && (
                      <div className="bg-amber-500 text-white rounded-xl px-2 py-1.5 flex items-center justify-between">
                         <span className="text-[8px] font-black opacity-80 uppercase">QTY</span>
                         <span className="text-[12px] font-black">{tracked.qty.toFixed(unit?.decimals || 0)}</span>
                      </div>
                    )}
                    {isSoldOut && (
                       <div className="bg-rose-500 text-white rounded-xl px-2 py-1.5 flex items-center justify-center">
                         <span className="text-[9px] font-black uppercase tracking-widest">OUT</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <QtyModal 
        isOpen={!!showQtyModal}
        item={showQtyModal}
        tempQty={tempQty}
        setTempQty={setTempQty}
        onClose={() => setShowQtyModal(null)}
        onUpdate={handleUpdateClick}
      />

    </div>
  );
};

export default SoldOutPage;
