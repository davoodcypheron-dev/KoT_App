
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { itemsDb, unitsDb, groupsDb } from '../data/mockDb';
import { getSoldOutTracking, saveToStore, APP_META_STORE } from '../data/idb';
import { ShoppingBag, Search, RefreshCcw, X, Tag, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QtyModal from '../components/modals/QtyModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const SoldOutPage = () => {
  const { notify } = useApp();
  const navigate = useNavigate();

  // Tracked items: { id, name, qty, isSoldOut }
  const [trackedItems, setTrackedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQtyModal, setShowQtyModal] = useState(null);
  const [tempQty, setTempQty] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Group selection states
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [groupSearch, setGroupSearch] = useState('');
  const groupListRef = React.useRef(null);

  React.useEffect(() => {
    const fetchSoldOut = async () => {
       const data = await getSoldOutTracking();
       setTrackedItems(data || []);
    };
    fetchSoldOut();
  }, []);

  const updateTrackedInIDB = async (newArr) => {
    setTrackedItems(newArr);
    await saveToStore(APP_META_STORE, { key: 'sold_out_items', value: newArr });
  };

  const groups = useMemo(() => {
    return [
      { id: 'ALL', name: 'All Items', type: 'all' },
      ...groupsDb.map(g => ({ ...g, type: 'group' }))
    ];
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groupSearch) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  }, [groups, groupSearch]);

  const moveGroup = (direction) => {
    if (groupListRef.current) {
      const scrollAmount = 180;
      groupListRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const allAvailableItems = useMemo(() => {
    return itemsDb.map(i => ({ ...i, type: 'ITEM' }));
  }, []);

  const filteredItems = useMemo(() => {
    let items = allAvailableItems;

    // Filter by activeGroup
    if (activeGroup !== 'ALL') {
      items = items.filter(i => i.groupId === activeGroup);
    }

    // Filter by search term if provided
    if (searchTerm.trim().length > 0) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) || (item.id && item.id.toLowerCase().includes(q))
      );
    }

    return items;
  }, [activeGroup, allAvailableItems, searchTerm]);

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

  const resetAll = () => {
    setShowConfirmReset(true);
  };

  const handleConfirmReset = async () => {
    await updateTrackedInIDB([]);
    notify('All stock tracking cleared', 'success');
    setShowConfirmReset(false);
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
    <div className="flex-1 flex flex-col bg-[#fff8e7] overflow-hidden h-screen font-sans">
      {/* Top Navigation Panel */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 shadow-sm relative z-[100]">
        <h1 className="text-lg font-black text-slate-800 tracking-tight mr-2">Item Sold Out</h1>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search items by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-500 text-slate-400 transition-all cursor-pointer"
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={resetAll}
            className="h-11 px-5 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-95 hover:bg-slate-900 cursor-pointer transition-all"
          >
            <RefreshCcw size={16} /> Reset All
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-3 overflow-hidden p-3.5">
        {/* PART 1: ITEMS GRID */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/70 backdrop-blur-xs border border-slate-200 rounded-2xl p-4 shadow-inner">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
                <ShoppingBag size={100} strokeWidth={1} />
                <div className="text-center">
                  <p className="font-black text-xl uppercase tracking-[0.2em] leading-none">
                    {searchTerm ? "No matching items" : "No items in this group"}
                  </p>
                  <p className="font-bold text-xs mt-3 uppercase tracking-widest">
                    {searchTerm ? "Try a different search term" : "Select another group or All Items"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5 pb-12">
                {filteredItems.map((item) => {
                  const tracked = trackedItems.find(ti => ti.id === item.id);
                  const isSoldOut = tracked?.isSoldOut;
                  const unit = unitsDb.find(u => u.id === item.unitId);

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`relative h-38 p-4 rounded-3xl border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                        tracked 
                          ? (isSoldOut ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-amber-50 border-amber-300 shadow-sm')
                          : 'bg-white border-slate-100 shadow-xs hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Reset Button (Only if tracked) */}
                      {tracked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItemTracking(item.id);
                          }}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-90 z-20 transition-colors cursor-pointer"
                          title="Reset to Available"
                        >
                          <X size={13} strokeWidth={3} />
                        </button>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-black text-[11px] text-slate-800 leading-tight uppercase line-clamp-2">{item.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{item.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${tracked ? (isSoldOut ? 'text-rose-600' : 'text-amber-600') : 'text-slate-400'}`}>
                            {isSoldOut ? 'Sold Out' : (tracked ? 'Limited Stock' : 'Available')}
                          </span>
                        </div>

                        {tracked && !isSoldOut && (
                          <div className="bg-amber-500 text-white rounded-xl px-2 py-1 flex items-center justify-between shadow-xs">
                            <span className="text-[8px] font-black opacity-80 uppercase">QTY</span>
                            <span className="text-[12px] font-black">{tracked.qty.toFixed(unit?.decimals || 0)}</span>
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="bg-rose-500 text-white rounded-xl px-2 py-1 flex items-center justify-center shadow-xs">
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
        </div>

        {/* PART 2: GROUP LIST SIDEBAR */}
        <div className="w-[230px] bg-[#f8fafc] border border-slate-200 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-xs">
          <div className="p-3 shrink-0 bg-white space-y-2 border-b border-slate-100">
            <div className="relative group">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={15} />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search Group..."
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl h-10 pl-9 pr-3 text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-400 outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex gap-1.5 h-9">
              <button 
                type="button" 
                onClick={() => moveGroup('up')} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-all shadow-2xs active:translate-y-0.5 cursor-pointer"
              >
                <ChevronUp size={18} />
              </button>
              <button 
                type="button" 
                onClick={() => moveGroup('down')} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-all shadow-2xs active:translate-y-0.5 cursor-pointer"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          <div
            ref={groupListRef}
            className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4 bg-slate-50/60"
          >
            {/* All Items Button */}
            {filteredGroups.some(g => g.id === 'ALL') && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveGroup('ALL')}
                  className={`w-full h-14 rounded-2xl px-3 flex flex-col items-center justify-center text-center transition-all group relative border-2 cursor-pointer ${
                    activeGroup === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  } active:scale-95`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wider leading-tight">All Items</span>
                  <span className="text-[8px] font-bold opacity-75 mt-0.5">{allAvailableItems.length} items</span>
                </button>
              </div>
            )}

            {/* Groups / Categories */}
            {filteredGroups.filter(g => g.type === 'group').length > 0 && (
              <div className="space-y-2">
                <div className="px-1 flex items-center gap-2">
                  <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">Groups</span>
                  <div className="flex-1 h-[1px] bg-sky-100" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {filteredGroups.filter(g => g.type === 'group').map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveGroup(group.id)}
                      className={`w-full h-13 rounded-2xl px-3 flex flex-col items-center justify-center text-center transition-all group relative border-2 cursor-pointer ${
                        activeGroup === group.id
                          ? 'bg-sky-600 text-white border-sky-700 shadow-md scale-[1.02]'
                          : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                      } active:scale-95`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{group.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <QtyModal 
        isOpen={!!showQtyModal}
        item={showQtyModal}
        tempQty={tempQty}
        setTempQty={setTempQty}
        onClose={() => setShowQtyModal(null)}
        onUpdate={handleUpdateClick}
      />

      {showConfirmReset && (
        <ConfirmationModal
          isOpen={showConfirmReset}
          title="Reset All Stock?"
          message="Are you sure you want to reset all stock tracking? This will make all items available again."
          confirmText="Reset All"
          cancelText="Cancel"
          onCancel={() => setShowConfirmReset(false)}
          onConfirm={handleConfirmReset}
        />
      )}

    </div>
  );
};

export default SoldOutPage;
