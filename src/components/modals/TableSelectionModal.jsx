import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Table as TableIcon, Layers, AlertCircle, Search } from 'lucide-react';
import { tablesDb, floorsDb } from '../../data/mockDb';
import { getActiveOrdersByType } from '../../data/idb';

const TableSelectionModal = ({ isOpen, onClose, currentTable, onSelectTable }) => {
  const [liveOrders, setLiveOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchLiveOrders = async () => {
      try {
        const diOrders = await getActiveOrdersByType('DI');
        if (isMounted) {
          setLiveOrders(diOrders || []);
        }
      } catch (e) {
        console.error("Failed loading IDB orders inside TableSelectionModal", e);
      }
    };

    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  const tablesWithStatus = useMemo(() => {
    return tablesDb.map(table => {
      const activeOrder = liveOrders.find(o => o.tableId === table.id);
      let status = 'vacant';
      if (activeOrder) {
        status = (activeOrder.status || 'running').toLowerCase();
      }
      return {
        ...table,
        status,
        amount: activeOrder ? activeOrder.grandTotal || 0 : 0,
        kotCount: activeOrder ? activeOrder.latestKotNo || 0 : 0
      };
    });
  }, [liveOrders]);

  const getNextVirtualId = (tableId) => {
    const baseId = tableId.toString().split('-')[0];
    const siblings = liveOrders
      .filter(o => o.tableId.toString() === baseId || o.tableId.toString().startsWith(`${baseId}-`))
      .map(o => o.tableId.toString());

    let maxSerial = 0;
    siblings.forEach(sid => {
      if (sid.includes('-')) {
        const serial = parseInt(sid.split('-')[1]);
        if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
      }
    });

    return `${baseId}-${maxSerial + 1}`;
  };

  const handleSelectTable = (table) => {
    if (table.status !== 'vacant') {
      const nextId = getNextVirtualId(table.id);
      const virtualTable = {
        ...table,
        id: nextId,
        status: 'vacant',
        isVirtual: true,
        parentId: table.id.toString().split('-')[0]
      };
      onSelectTable(virtualTable);
    } else {
      onSelectTable(table);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-4xl h-[700px] rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <TableIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Switch Table</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select table to re-assign current order</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Box */}
          <div className="px-6 py-3 border-b border-slate-100 bg-white flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search tables by number/ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold placeholder:text-slate-400 shadow-inner"
                autoFocus
              />
            </div>
          </div>

          {/* List of Tables grouped by Floor */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar space-y-8">
            {floorsDb.map(floor => {
              const floorTables = tablesWithStatus.filter(
                t => t.floor === floor.id && 
                t.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (floorTables.length === 0) return null;

              return (
                <div key={floor.id} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3.5 w-1 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      {floor.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {floorTables.map(table => {
                      const isCurrent = currentTable?.id === table.id;
                      
                      let cardStyle = 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/10';
                      if (isCurrent) {
                        cardStyle = 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-500/20';
                      }

                      return (
                        <motion.button
                          key={table.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSelectTable(table)}
                          className={`h-16 px-4 rounded-2xl border flex flex-col justify-center gap-1 text-left transition-all ${cardStyle}`}
                        >
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            {table.id}
                          </span>
                          {isCurrent && (
                            <span className="text-[7px] bg-blue-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest w-fit">
                              Active
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* If NO tables match search at all */}
            {tablesWithStatus.filter(t => t.id.toString().toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <AlertCircle size={36} className="opacity-40 mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">No tables match "{searchQuery}"</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TableSelectionModal;
