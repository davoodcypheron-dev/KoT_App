import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { itemsDb } from '../data/mockDb';
import {
  Plus, Trash2, Save, X, Search, ChevronDown, Check,
  Layers, Package, Tag, Settings, Info, DollarSign,
  Maximize2, Minimize2, CheckCircle2, AlertCircle, Circle,
  FileText, FolderSearch, Eraser, RefreshCw, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAddon, getAllAddons } from '../data/idb';
import MasterNavPanel from '../components/MasterNavPanel';

const AddonMaster = () => {
  const { notify } = useApp();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [price, setPrice] = useState('0.00');
  const [status, setStatus] = useState(true); // true for Active
  const [isTaxIncluded, setIsTaxIncluded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [findSearchTerm, setFindSearchTerm] = useState('');
  const [addonsList, setAddonsList] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [editingId, setEditingId] = useState(null);

  React.useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    try {
      const data = await getAllAddons();
      setAddonsList(data);
      setGridData(data);
    } catch (err) {
      notify('Failed to load addons', 'error');
    }
  };

  const filteredItems = itemsDb.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemSearchTerm(`${item.id} - ${item.name}`);
    if (!displayName.trim()) {
      setDisplayName(item.name);
    }
    setPrice(item.price.toFixed(2));
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!displayName.trim()) return notify('Please enter a display name', 'error');
    if (!selectedItem) return notify('Please select a base item', 'error');

    const addonData = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      displayName: displayName,
      price: parseFloat(price),
      isTaxIncluded: isTaxIncluded,
      status: status ? 'Active' : 'Inactive',
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      addonData.id = editingId;
    } else {
      addonData.createdAt = new Date().toISOString();
    }

    try {
      await saveAddon(addonData);
      notify(editingId ? 'Addon updated successfully' : 'Addon saved successfully', 'success');
      handleClear();
      loadAddons();
    } catch (err) {
      notify('Error saving addon', 'error');
    }
  };

  const handleClear = () => {
    setDisplayName('');
    setPrice('0.00');
    setSelectedItem(null);
    setItemSearchTerm('');
    setStatus(true);
    setIsTaxIncluded(false);
    setEditingId(null);
    notify('Form cleared', 'info');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFind = () => {
    const filtered = addonsList.filter(addon =>
      addon.displayName.toLowerCase().includes(findSearchTerm.toLowerCase()) ||
      addon.itemName.toLowerCase().includes(findSearchTerm.toLowerCase())
    );
    setGridData(filtered);
    notify(`Found ${filtered.length} records`, 'success');
  };

  const handleReset = () => {
    setFindSearchTerm('');
    setGridData(addonsList);
    notify('Filters reset', 'info');
  };

  const handleEdit = (addon) => {
    setEditingId(addon.id);
    setDisplayName(addon.displayName);
    setPrice(addon.price.toString());
    setIsTaxIncluded(addon.isTaxIncluded);
    setStatus(addon.status === 'Active');
    setSelectedItem({ id: addon.itemId, name: addon.itemName });
    setItemSearchTerm(`${addon.itemId} - ${addon.itemName}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('Record loaded for editing', 'info');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f0f4f7] overflow-hidden">
      <MasterNavPanel />
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-4">
        {/* TOP PART: SAVE */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-3">
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 flex items-center gap-2">
            <Save size={14} /> Save
          </h2>

          <div className="grid grid-cols-12 gap-2">
            {/* 1. Addon Display Name */}
            <div className="col-span-6 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Addon Display Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full h-9 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400"
              />
            </div>

            {/* 2. Base Item (Type-ahead Search) */}
            <div className="col-span-6 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Base Item *</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Type to search base item..."
                  value={itemSearchTerm}
                  onChange={(e) => {
                    setItemSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full h-9 border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-400 bg-white shadow-inner transition-all"
                />

                <AnimatePresence>
                  {showSuggestions && itemSearchTerm.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md z-20 max-h-48 overflow-y-auto no-scrollbar"
                      >
                        {filteredItems.length > 0 ? (
                          filteredItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleSelectItem(item)}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                            >
                              <div className="text-[10px] font-bold text-slate-800">{item.name}</div>
                              <div className="text-[9px] text-slate-400 uppercase tracking-tighter">{item.id} • ₹{item.price}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-[10px] text-slate-400 text-center italic">No items found</div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="col-span-6 grid grid-cols-12 gap-8 items-end border-slate-50">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Price *</label>
                <div className="relative">

                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-9 border border-slate-300 rounded-sm pl-7 pr-3 text-xs text-end outline-none focus:border-blue-400 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-600">Tax Included</label>
                <div className="flex items-center h-9">
                  <button
                    onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                    className={`relative w-11 h-5 rounded-full transition-colors duration-200 focus:outline-none ${isTaxIncluded ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isTaxIncluded ? 'translate-x-6' : 'translate-x-0 shadow-sm'}`} />
                  </button>
                  <span className="ml-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isTaxIncluded ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="col-span-3">
                <label className="text-[11px] font-bold text-slate-600">Status</label>
                <div className="flex items-center h-9">
                  <button
                    onClick={() => setStatus(!status)}
                    className={`relative w-11 h-5 rounded-full transition-colors duration-200 focus:outline-none ${status ? 'bg-[#4ebcc3]' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${status ? 'translate-x-6' : 'translate-x-0 shadow-sm'}`} />
                  </button>
                  <span className="ml-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3 border-t border-slate-100 pt-2">
            <button
              onClick={handleSave}
              className="bg-[#90e1a4] hover:bg-[#78cc8d] text-emerald-900 h-9 px-8 rounded-lg flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Save size={16} /> {editingId ? 'Update Record' : 'Save Record'}
            </button>
            <button
              onClick={handleClear}
              className="bg-[#fd7c7c] hover:bg-[#f35959] text-white h-9 px-8 rounded-lg flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Eraser size={16} /> Clear Form
            </button>
            <button
              onClick={handleRefresh}
              className="bg-[#e1e9f0] hover:bg-slate-200 text-slate-700 h-9 px-8 rounded-lg flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* BOTTOM PART: FIND */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col overflow-hidden h-[430px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
              <Search size={14} /> Search Records
            </h2>
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4 space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Find by Name</label>
                <input
                  type="text"
                  value={findSearchTerm}
                  onChange={(e) => setFindSearchTerm(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400"
                />
              </div>
              <div className="col-span-8 flex justify-end gap-2 text-end">
                <button
                  onClick={handleFind}
                  className="bg-[#7c8cfd] hover:bg-[#6a79e4] text-white h-8 px-6 rounded-md flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  <Search size={14} /> Find Now
                </button>
                <button
                  onClick={handleReset}
                  className="bg-[#fd7c7c] hover:bg-[#f35959] text-white h-8 px-6 rounded-md flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  <Eraser size={14} /> Reset
                </button>
              </div>
            </div>
          </div>

          <div className="p-2 border-b border-slate-200 bg-slate-50/20">
            <div className="w-48 relative">
              <input
                type="text"
                placeholder="Filter grid..."
                className="w-full h-7 border border-slate-300 rounded-sm px-2 text-xs bg-white outline-none focus:border-blue-400 shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#fcfdff] border-b border-slate-200 sticky top-0 bg-white">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Addon Name</th>
                  <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Display Name</th>
                  <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Price</th>
                  <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Status</th>
                  <th className="px-3 py-2 font-bold text-slate-700 w-16 text-center">Edit</th>
                </tr>
              </thead>
              <tbody>
                {gridData.length > 0 ? gridData.map((addon, index) => (
                  <tr key={addon.id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-all font-bold text-slate-700">
                    <td className="px-3 py-2 border-r border-slate-100">{addon.itemName}</td>
                    <td className="px-3 py-2 border-r border-slate-100">{addon.displayName}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-end">₹{addon.price.toFixed(2)}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-tighter ${addon.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {addon.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleEdit(addon)}
                        className="text-blue-500 hover:text-blue-700 transition-all active:scale-90"
                        title="Edit Record"
                      >
                        <FileText size={14} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr className="border-b border-slate-100 italic text-slate-400 text-center">
                    <td className="px-3 py-12" colSpan="5">No records matching your search</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddonMaster;
