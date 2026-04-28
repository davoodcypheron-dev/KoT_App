import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { itemsDb } from '../data/mockDb';
import {
  Plus, Trash2, Save, X, Search, ChevronDown, Check,
  Layers, Package, Tag, Settings, Info, DollarSign,
  Maximize2, Minimize2, CheckCircle2, AlertCircle, Circle,
  FileText, FolderSearch, Eraser, RefreshCw, Home, Link as LinkIcon, Link2Off
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAddons, saveItemAddonLink, getAllItemAddonLinks, deleteItemAddonLink } from '../data/idb';
import MasterNavPanel from '../components/MasterNavPanel';

const BRANCHES = [
  { id: 'B1', name: 'Antigravity Kitchen' },
  { id: 'B2', name: 'Main Branch' },
  { id: 'B3', name: 'Downtown Branch' }
];

const ItemAddonMaster = () => {
  const { notify } = useApp();
  const navigate = useNavigate();

  // Data States
  const [dbAddons, setDbAddons] = useState([]);
  const [itemAddonLinks, setItemAddonLinks] = useState([]);
  const [gridData, setGridData] = useState([]);

  // Form States (Left Section)
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Antigravity Kitchen');
  const [addonSearchTerm, setAddonSearchTerm] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [status, setStatus] = useState(true); // Active/Inactive

  // Search/Filter States (Right Section)
  const [findSearchTerm, setFindSearchTerm] = useState('');
  const [findBranchFilter, setFindBranchFilter] = useState('');
  const [filterGridTerm, setFilterGridTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [addons, links] = await Promise.all([
        getAllAddons(),
        getAllItemAddonLinks()
      ]);
      setDbAddons(addons);
      setItemAddonLinks(links);
      setGridData(links);
    } catch (err) {
      notify('Failed to load data', 'error');
    }
  };

  // Step 1: Filter Master Items for Dropdown
  const filteredMasterItems = useMemo(() => {
    const term = itemSearchTerm.toLowerCase().trim();
    if (!term) return [];
    return itemsDb.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term)
    );
  }, [itemSearchTerm]);

  // Step 2: Selecting an Item from Search
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemSearchTerm(`${item.id} - ${item.name}`);
    setShowSuggestions(false);

    // Check if it already has a mapping
    const existing = itemAddonLinks.find(l => l.itemId === item.id);
    if (existing) {
      setSelectedAddonIds(existing.addons.map(a => a.id));
      setStatus(existing.status !== 'Inactive');
    } else {
      setSelectedAddonIds([]);
      setStatus(true);
    }
  };

  // Step 3: Filter Addons for Selection Table (Filter by branch AND search term)
  const filteredAddons = useMemo(() => {
    const term = addonSearchTerm.toLowerCase().trim();
    return dbAddons.filter(a => {
      const matchBranch = a.branch === selectedBranch;
      const matchSearch = term ? (a.displayName.toLowerCase().includes(term) || a.itemName.toLowerCase().includes(term)) : true;
      return matchBranch && matchSearch;
    });
  }, [dbAddons, addonSearchTerm, selectedBranch]);

  const toggleAddonSelection = (addonId) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleSave = async () => {
    if (!selectedItem) {
      notify('Please select an item first', 'error');
      return;
    }

    const linkedAddons = dbAddons.filter(a => selectedAddonIds.includes(a.id));

    if (linkedAddons.length === 0) {
      if (window.confirm('No addons selected. This will remove any existing addon links for this item. Continue?')) {
        try {
          await deleteItemAddonLink(selectedItem.id);
          notify('Links cleared', 'success');
          loadData();
          handleClear();
        } catch (err) {
          notify('Error clearing links', 'error');
        }
      }
      return;
    }

    const linkData = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      addons: linkedAddons,
      branch: selectedBranch,
      status: status ? 'Active' : 'Inactive',
      updatedAt: new Date().toISOString()
    };

    try {
      await saveItemAddonLink(linkData);
      notify('Mapping saved successfully', 'success');
      loadData();
      handleClear();
    } catch (err) {
      notify('Error saving mapping', 'error');
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    setItemSearchTerm('');
    setSelectedAddonIds([]);
    setStatus(true);
    setAddonSearchTerm('');
    notify('Form cleared', 'info');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFind = () => {
    const term = findSearchTerm.toLowerCase().trim();
    const filtered = itemAddonLinks.filter(l => {
      const matchName = term ? (l.itemName.toLowerCase().includes(term) || l.itemId.toLowerCase().includes(term)) : true;
      const matchBranch = findBranchFilter ? l.branch === findBranchFilter : true;
      return matchName && matchBranch;
    });
    setGridData(filtered);
    notify(`Found ${filtered.length} mappings`, 'success');
  };

  const handleResetFind = () => {
    setFindSearchTerm('');
    setFindBranchFilter('');
    setGridData(itemAddonLinks);
    notify('Filters reset', 'info');
  };

  const handleEditMapping = (link) => {
    const item = itemsDb.find(i => i.id === link.itemId);
    if (item) {
      handleSelectItem(item);
      setSelectedBranch(link.branch || 'Antigravity Kitchen');
    }
  };

  const finalGridData = useMemo(() => {
    const term = filterGridTerm.toLowerCase().trim();
    if (!term) return gridData;
    return gridData.filter(l =>
      l.itemName.toLowerCase().includes(term) ||
      l.itemId.toLowerCase().includes(term)
    );
  }, [gridData, filterGridTerm]);

  return (
    <div className="flex-1 flex flex-col bg-[#fbf2f2] overflow-hidden h-screen font-sans">
      <MasterNavPanel />

      {/* Content - Same Height Logic */}
      <div className="flex-1 overflow-hidden p-2 flex gap-3 bg-[#f0f4f7]">

        {/* LEFT SECTION: SAVE (Theme matched to AddonMaster) */}
        <div className="flex-1 flex flex-col bg-white border border-slate-300 rounded-sm shadow-sm relative">
          <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300 shrink-0 rounded-t-sm">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Save</h2>
          </div>

          <div className="p-2 space-y-2.5 flex-1 flex flex-col overflow-hidden">
            {/* Top Row: Branch, Item Search & Status (Tightened) */}
            <div className="grid grid-cols-12 gap-2 shrink-0">
              <div className="col-span-3 space-y-0.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Branch *</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded-sm px-2 text-[11px] outline-none focus:border-blue-400 bg-white font-bold text-slate-700"
                >
                  {BRANCHES.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-7 space-y-0.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Base Item *</label>
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
                    className="w-full h-8 border border-slate-300 rounded-sm px-2 text-[11px] outline-none focus:border-blue-400 bg-white"
                  />
                  <AnimatePresence>
                    {showSuggestions && itemSearchTerm.trim().length > 0 && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setShowSuggestions(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md z-[70] max-h-48 overflow-y-auto no-scrollbar"
                        >
                          {filteredMasterItems.length > 0 ? (
                            filteredMasterItems.map(item => (
                              <button
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <div className="text-[10px] font-bold text-slate-800">{item.name}</div>
                                  <div className="text-[9px] text-slate-400 uppercase tracking-tighter">{item.id} • ₹{item.price}</div>
                                </div>
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

              <div className="col-span-2 space-y-0.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Status</label>
                <div className="flex items-center h-8">
                  <button
                    onClick={() => setStatus(!status)}
                    className={`w-28 h-7 border border-slate-300 flex items-center relative overflow-hidden transition-all duration-300 focus:outline-none ${status ? 'bg-[#e6f3ff]' : 'bg-white'}`}
                  >
                    {status ? (
                      <>
                        <span className="flex-1 text-center text-[9px] font-black uppercase text-slate-700">Active</span>
                        <div className="w-2 h-full bg-[#0078d4]" />
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-full bg-slate-600" />
                        <span className="flex-1 text-center text-[9px] font-black uppercase text-slate-700">Inactive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Middle part: Addon selection with Instant Search */}
            <div className="space-y-1.5 flex-1 flex flex-col overflow-hidden">
              <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300 flex items-center justify-between shrink-0">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Step 2: Link Addons</label>
                <div className="relative w-40">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Filter list..."
                    value={addonSearchTerm}
                    onChange={(e) => setAddonSearchTerm(e.target.value)}
                    className="w-full h-7 border border-slate-300 rounded-sm pl-8 pr-2 text-[10px] font-bold outline-none focus:border-blue-400 bg-white shadow-inner"
                  />
                </div>
              </div>

              <div className="border border-slate-300 rounded-sm overflow-hidden flex-1 flex flex-col bg-white">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f2f2f2] border-b border-slate-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800 w-10 text-center uppercase text-[9px]">
                          Sel
                        </th>
                        <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800 uppercase text-[9px]">Addon Name</th>
                        <th className="px-3 py-2 font-bold text-slate-800 uppercase text-[9px] text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAddons.map((addon) => {
                        const isSelected = selectedAddonIds.includes(addon.id);
                        return (
                          <tr
                            key={addon.id}
                            onClick={() => toggleAddonSelection(addon.id)}
                            className={`border-b border-slate-100 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                          >
                            <td className="px-3 py-2 text-center border-r border-slate-50">
                              <div className={`w-4 h-4 rounded-sm border-2 mx-auto flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                {isSelected && <Check size={10} strokeWidth={4} />}
                              </div>
                            </td>
                            <td className="px-3 py-2 border-r border-slate-50">
                              <span className={`text-[10px] font-bold uppercase tracking-tight ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{addon.displayName}</span>
                              <div className="text-[8px] text-slate-400 font-bold italic opacity-60">Source: {addon.itemName}</div>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-700 text-[10px]">
                              ₹{parseFloat(addon.price).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Row: Actions (Match AddonMaster colors) */}
            <div className="flex items-center justify-between bg-slate-100 p-2 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-black text-blue-600 bg-white border border-blue-200 px-2.5 py-1.5 rounded-sm shadow-inner min-w-[30px] text-center">
                  {selectedAddonIds.length}
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Selected</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-[#90e1a4] hover:bg-[#78cc8d] text-emerald-900 h-9 px-6 rounded-lg flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  <Save size={16} /> Save Record
                </button>
                <button
                  onClick={handleClear}
                  className="bg-[#fd7c7c] hover:bg-[#f35959] text-white h-9 px-6 rounded-lg flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  <Eraser size={16} /> Clear
                </button>
                <button
                  onClick={handleRefresh}
                  className="bg-[#e1e9f0] hover:bg-slate-200 text-slate-700 h-9 px-6 rounded-lg flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: FIND (Theme matched to AddonMaster) */}
        <div className="flex-1 flex flex-col bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden text-slate-800">
          <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300 shrink-0">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Find</h2>
          </div>
          <div className="p-3 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight ml-0.5">Branch</label>
                <select
                  value={findBranchFilter}
                  onChange={(e) => setFindBranchFilter(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">All Branches</option>
                  {BRANCHES.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-4 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight ml-0.5">Find by Item Name</label>
                <input
                  type="text"
                  value={findSearchTerm}
                  onChange={(e) => setFindSearchTerm(e.target.value)}
                  placeholder="Enter item name..."
                  className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 bg-white"
                />
              </div>
              <div className="col-span-4 flex gap-1.5 h-8">
                <button
                  onClick={handleFind}
                  className="bg-[#7c8cfd] hover:bg-[#6a79e4] text-white flex-1 rounded-md flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  <Search size={14} /> Find
                </button>
                <button
                  onClick={handleResetFind}
                  className="bg-[#fd7c7c] hover:bg-[#f35959] text-white flex-1 rounded-md flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Grid Filter and Total */}
          <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0 flex items-center gap-3">
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                placeholder="Filter grid..."
                value={filterGridTerm}
                onChange={(e) => setFilterGridTerm(e.target.value)}
                className="w-full h-7 border border-slate-300 rounded-sm pl-7 pr-2 text-[10px] font-bold bg-slate-50 shadow-inner"
              />
            </div>
            <div className="flex-1" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Found: {finalGridData.length} records</span>
          </div>

          {/* Table (Match AddonMaster Styling) */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#f2f2f2] border-b border-slate-300 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 border-r border-slate-300 font-bold text-slate-800 uppercase text-[9px] w-32">Branch</th>
                  <th className="px-3 py-3 border-r border-slate-300 font-bold text-slate-800 uppercase text-[9px]">Item Name</th>
                  <th className="px-3 py-3 border-r border-slate-300 font-bold text-slate-800 uppercase text-[9px] text-center w-24">Addons</th>
                  <th className="px-3 py-3 border-r border-slate-300 font-bold text-slate-800 uppercase text-[9px] text-center w-24">Status</th>
                  <th className="px-3 py-3 font-bold text-slate-800 w-16 text-center uppercase text-[9px]">Edit</th>
                </tr>
              </thead>
              <tbody>
                {finalGridData.length > 0 ? finalGridData.map((link) => (
                  <tr key={link.itemId} className="border-b border-slate-100 hover:bg-slate-50 transition-all font-bold text-slate-700">
                    <td className="px-3 py-3 border-r border-slate-50 text-blue-600">
                      {link.branch || 'None'}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-50">
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{link.itemName}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{link.itemId}</div>
                    </td>
                    <td className="px-3 py-3 border-r border-slate-50 text-center">
                      <span className="text-[12px] font-black text-blue-600 bg-blue-50/50 px-2 py-1 rounded border border-blue-100 min-w-[30px] inline-block">
                        {link.addons.length}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-slate-50 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-tighter ${link.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {link.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleEditMapping(link)}
                        className="text-blue-500 hover:text-blue-700 transition-all active:scale-90"
                        title="Edit Record"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr className="border-b border-slate-100 italic text-slate-400 text-center">
                    <td className="px-3 py-20" colSpan="5">
                      <div className="flex flex-col items-center gap-3">
                        <Link2Off size={40} strokeWidth={1} />
                        <span className="font-black uppercase tracking-widest text-[10px]">No records match your search</span>
                      </div>
                    </td>
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

export default ItemAddonMaster;
