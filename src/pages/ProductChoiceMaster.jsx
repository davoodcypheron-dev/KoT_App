import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { itemsDb } from '../data/mockDb';
import {
  Plus, Trash2, Save, X, Search, ChevronDown, Check, Edit2,
  Layers, Package, Tag, Settings, Info, DollarSign,
  Maximize2, Minimize2, CheckCircle2, AlertCircle, Circle,
  FileText, FolderSearch, Eraser, RefreshCw, Home, Layers as LayersIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAddons, saveProduct, getAllProducts } from '../data/idb';
import MasterNavPanel from '../components/MasterNavPanel';

const ProductChoiceMaster = () => {
  const { notify } = useApp();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState('save'); // 'save' or 'find'

  // Header States
  const [choiceType, setChoiceType] = useState('CHOICE_ITEM'); // 'Choice Item' or 'Combo Item'
  const [productDisplayName, setProductDisplayName] = useState('');
  const [status, setStatus] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [pendingTypeChange, setPendingTypeChange] = useState(null);

  // Left Pane Form States (Variants/Contents)
  const [baseItemSearch, setBaseItemSearch] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [selectedBaseItem, setSelectedBaseItem] = useState(null);
  const [variantDisplayName, setVariantDisplayName] = useState('');
  const [variantPrice, setVariantPrice] = useState('0.00');
  const [minQty, setMinQty] = useState('1');
  const [maxQty, setMaxQty] = useState('1');
  const [qty, setQty] = useState('1');
  const [variantTaxIncluded, setVariantTaxIncluded] = useState(false);
  const [variantStatus, setVariantStatus] = useState(true);
  const [variantsList, setVariantsList] = useState([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);

  // Right Pane Addons States
  const [availableAddons, setAvailableAddons] = useState([]);
  const [addonSearch, setAddonSearch] = useState('');
  const [showAddonSuggestions, setShowAddonSuggestions] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Find Section States
  const [findSearchTerm, setFindSearchTerm] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [gridData, setGridData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const addons = await getAllAddons();
      const activeAddons = addons.filter(addon => addon.status === 'Active');
      setAvailableAddons(activeAddons);
      const products = await getAllProducts();
      setProductsList(products);
      setGridData(products);
    } catch (err) {
      notify('Failed to load data', 'error');
    }
  };

  const filteredBaseItems = itemsDb.filter(item =>
    item.name.toLowerCase().includes(baseItemSearch.toLowerCase()) ||
    item.id.toLowerCase().includes(baseItemSearch.toLowerCase())
  );

  const handleSelectBaseItem = (item) => {
    setSelectedBaseItem(item);
    setBaseItemSearch(`${item.id} - ${item.name}`);
    if (!variantDisplayName.trim()) setVariantDisplayName(item.name);
    setVariantPrice(item.price.toFixed(2));
    setShowItemSuggestions(false);
  };

  const handleAddVariant = () => {
    if (!selectedBaseItem) return notify('Please select a base item', 'error');
    if (!variantDisplayName.trim()) return notify('Please enter display name', 'error');

    const newVariant = {
      itemId: selectedBaseItem.id,
      itemName: selectedBaseItem.name,
      displayName: variantDisplayName,
      price: parseFloat(variantPrice),
      taxIncluded: variantTaxIncluded,
      ...(choiceType === 'CHOICE_ITEM' ? { minQty: parseInt(minQty), maxQty: parseInt(maxQty), status: variantStatus ? 'Active' : 'Inactive' } : { qty: parseInt(qty) })
    };

    if (editingVariantIndex !== null) {
      const updated = [...variantsList];
      updated[editingVariantIndex] = newVariant;
      setVariantsList(updated);
      setEditingVariantIndex(null);
      notify('Updated successfully', 'success');
    } else {
      setVariantsList([...variantsList, newVariant]);
      notify('Added successfully', 'success');
    }

    setSelectedBaseItem(null);
    setBaseItemSearch('');
    setVariantDisplayName('');
    setVariantPrice('0.00');
    setMinQty('1');
    setMaxQty('1');
    setQty('1');
    setVariantTaxIncluded(false);
    setVariantStatus(true);
  };

  const removeVariant = (index) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  const editVariant = (index) => {
    const v = variantsList[index];
    setEditingVariantIndex(index);
    setSelectedBaseItem({ id: v.itemId, name: v.itemName });
    setBaseItemSearch(`${v.itemId} - ${v.itemName}`);
    setVariantDisplayName(v.displayName);
    setVariantPrice(v.price.toString());
    setVariantTaxIncluded(v.taxIncluded);
    if (choiceType === 'CHOICE_ITEM') {
      setMinQty(v.minQty.toString());
      setMaxQty(v.maxQty.toString());
      setVariantStatus(v.status === 'Active');
    } else {
      setQty(v.qty.toString());
    }
  };

  const handleToggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleSave = async () => {
    if (!productDisplayName.trim()) return notify('Please enter display name', 'error');
    if (variantsList.length === 0 && selectedAddons.length === 0) {
      return notify('Please add at least one variant or addon', 'error');
    }

    const productData = {
      type: choiceType,
      displayName: productDisplayName,
      status: status ? 'Active' : 'Inactive',
      variants: variantsList,
      addons: selectedAddons,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      productData.id = editingId;
    } else {
      productData.createdAt = new Date().toISOString();
    }

    try {
      await saveProduct(productData);
      notify(editingId ? 'Product updated successfully' : 'Product saved successfully', 'success');
      handleClear();
      loadData();
    } catch (err) {
      notify('Error saving product', 'error');
    }
  };

  const handleTypeChange = (newType) => {
    if (variantsList.length > 0 || selectedAddons.length > 0) {
      setPendingTypeChange(newType);
    } else {
      setChoiceType(newType);
    }
  };

  const confirmTypeChange = () => {
    setVariantsList([]);
    setSelectedAddons([]);
    setChoiceType(pendingTypeChange);
    setPendingTypeChange(null);
    notify('Product type changed and items cleared', 'info');
  };

  const cancelTypeChange = () => {
    setPendingTypeChange(null);
  };

  const handleClear = () => {
    setProductDisplayName('');
    setStatus(true);
    setVariantsList([]);
    setSelectedAddons([]);
    setEditingId(null);
    setEditingVariantIndex(null);
    setBaseItemSearch('');
    setVariantDisplayName('');
    setVariantPrice('0.00');
    notify('Form cleared', 'info');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFind = () => {
    const filtered = productsList.filter(p =>
      p.displayName.toLowerCase().includes(findSearchTerm.toLowerCase())
    );
    setGridData(filtered);
    notify(`Found ${filtered.length} records`, 'success');
  };

  const handleResetFind = () => {
    setFindSearchTerm('');
    setGridData(productsList);
  };

  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setChoiceType(product.type);
    setProductDisplayName(product.displayName);
    setStatus(product.status === 'Active');
    setVariantsList(product.variants || []);
    setSelectedAddons(product.addons || []);
    setActiveTab('save');
    notify('Product loaded for editing', 'info');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f0f4f7] overflow-hidden">
      <MasterNavPanel />
      {/* Tabs Layout */}
      <div className="flex bg-[#e1e9f0] px-2 pt-1 border-b border-slate-300 items-center justify-between">
        <div className="flex">
          <button
            onClick={() => setActiveTab('save')}
            className={`px-6 py-2 flex items-center gap-2 text-xs font-bold rounded-t-lg border-x border-t transition-all ${activeTab === 'save' ? 'bg-white border-slate-300 text-slate-800' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/50'}`}
          >
            <FileText size={14} className="text-blue-600" /> Save
          </button>
          <button
            onClick={() => setActiveTab('find')}
            className={`px-6 py-2 flex items-center gap-2 text-xs font-bold rounded-t-lg border-x border-t transition-all ${activeTab === 'find' ? 'bg-white border-slate-300 text-slate-800' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/50'}`}
          >
            <Search size={14} className="text-blue-700" /> Find
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {activeTab === 'save' ? (
          <div className="space-y-4">
            {/* TOP PART: SAVE */}
            <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-2">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 mb-1 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-2"><Save size={14} /> Product Choice Entry</div>
              </h2>

              <div className="grid grid-cols-12 gap-3 mb-2 items-end">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Combo Type *</label>
                  <select
                    value={choiceType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 bg-white shadow-sm font-bold text-slate-700"
                  >
                    <option value="CHOICE_ITEM">Choice Item</option>
                    <option value="COMBO_ITEM">Combo Item</option>
                  </select>
                </div>
                <div className="col-span-4 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Product Display Name *</label>
                  <input
                    type="text"
                    value={productDisplayName}
                    onChange={(e) => setProductDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 font-bold"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Status</label>
                  <div className="flex items-center h-8">
                    <button
                      onClick={() => setStatus(!status)}
                      className={`relative w-11 h-5 rounded-full transition-colors duration-200 ${status ? 'bg-[#4ebcc3]' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${status ? 'translate-x-6' : 'translate-x-0 shadow-sm'}`} />
                    </button>
                    <span className="ml-2 text-[9px] font-bold text-slate-500 uppercase">{status ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="col-span-5 flex justify-end gap-2">
                  <button onClick={handleSave} className="bg-[#90e1a4] hover:bg-[#78cc8d] text-emerald-900 h-8 px-4 rounded-md flex items-center gap-1.5 font-bold text-[10px] transition-all active:scale-95 shadow-sm">
                    <Save size={14} /> {editingId ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleClear} className="bg-[#fd7c7c] hover:bg-[#f35959] text-white h-8 px-4 rounded-md flex items-center gap-1.5 font-bold text-[10px] transition-all active:scale-95 shadow-sm">
                    <Eraser size={14} /> Clear
                  </button>
                  <button onClick={handleRefresh} className="bg-[#e1e9f0] hover:bg-slate-200 text-slate-700 h-8 px-4 rounded-md flex items-center gap-1.5 font-bold text-[10px] transition-all active:scale-95 shadow-sm">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                {/* Left Pane: Variants/Contents */}
                <div className="col-span-8 border border-slate-200 rounded-sm overflow-hidden flex flex-col bg-slate-50/20">
                  <div className="bg-[#4ebcc3] px-3 py-1.5 text-white font-bold text-[10px] uppercase tracking-wider flex justify-between items-center">
                    <span>{choiceType === 'CHOICE_ITEM' ? 'Variants' : 'Contents'}</span>
                    {editingVariantIndex !== null && <span className="bg-white/20 px-2 rounded-sm text-[9px]">EDITING</span>}
                  </div>

                  <div className="p-2 border-b border-slate-200 bg-white">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      {/* Base Item */}
                      <div className="col-span-3 space-y-1 relative">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Base Item *</label>
                        <input
                          type="text"
                          placeholder="Search..."
                          value={baseItemSearch}
                          onChange={(e) => { setBaseItemSearch(e.target.value); setShowItemSuggestions(true); }}
                          onFocus={() => setShowItemSuggestions(true)}
                          className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400"
                        />
                        <AnimatePresence>
                          {showItemSuggestions && baseItemSearch.length > 0 && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowItemSuggestions(false)} />
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-20 max-h-40 overflow-y-auto rounded-md no-scrollbar">
                                {filteredBaseItems.map(item => (
                                  <button key={item.id} onClick={() => handleSelectBaseItem(item)} className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-50 text-[10px]">
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-slate-400">{item.id} • ₹{item.price}</div>
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Display Name */}
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Display Name *</label>
                        <input
                          type="text"
                          value={variantDisplayName}
                          onChange={(e) => setVariantDisplayName(e.target.value)}
                          className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Price *</label>
                        <input
                          type="text"
                          value={variantPrice}
                          onChange={(e) => setVariantPrice(e.target.value)}
                          className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs text-end outline-none font-bold text-slate-700 focus:border-blue-400"
                        />
                      </div>

                      {/* Quantities / Toggles based on Mode */}
                      {choiceType === 'CHOICE_ITEM' ? (
                        <>
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Min Qty</label>
                            <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} className="w-full h-8 border border-slate-300 rounded-sm px-1 text-xs text-center outline-none" />
                          </div>
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Max Qty</label>
                            <input type="number" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} className="w-full h-8 border border-slate-300 rounded-sm px-1 text-xs text-center outline-none" />
                          </div>
                          <div className="col-span-1 space-y-1 text-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Tax Included</label>
                            <div className="flex justify-center h-8 items-center">
                              <button onClick={() => setVariantTaxIncluded(!variantTaxIncluded)} className={`w-9 h-4.5 rounded-full ${variantTaxIncluded ? 'bg-emerald-500' : 'bg-slate-300'} relative transition-colors`}>
                                <div className={`absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${variantTaxIncluded ? 'translate-x-4.5' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Qty</label>
                            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs text-center outline-none" />
                          </div>
                          <div className="col-span-2 space-y-1 text-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Tax Included</label>
                            <div className="flex justify-center h-8 items-center gap-1.5">
                              <button onClick={() => setVariantTaxIncluded(!variantTaxIncluded)} className={`w-9 h-4.5 rounded-full ${variantTaxIncluded ? 'bg-emerald-500' : 'bg-slate-300'} relative transition-colors`}>
                                <div className={`absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${variantTaxIncluded ? 'translate-x-4.5' : ''}`} />
                              </button>
                              <span className="text-[8px] font-bold text-slate-500 uppercase">{variantTaxIncluded ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Add Button */}
                      <div className={choiceType === 'CHOICE_ITEM' ? "col-span-3" : "col-span-3"}>
                        <button
                          onClick={handleAddVariant}
                          className="w-full bg-[#7c8cfd] text-white hover:bg-[#6a79e4] transition-all h-8 rounded-sm text-[10px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 px-2"
                        >
                          <Plus size={14} /> {editingVariantIndex !== null ? 'UPDATE' : 'ADD TO LIST'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FIXED HEIGHT WITH SCROLL */}
                  <div className="h-[425px] overflow-y-auto no-scrollbar bg-white">
                    <table className="w-full text-[10px] border-collapse">
                      <thead className="bg-[#fcfdff] border-b border-slate-200 sticky top-0 bg-white shadow-sm">
                        <tr>
                          <th className="px-3 py-2 text-left border-r border-slate-200 font-bold text-slate-700">Display Name</th>
                          <th className="px-3 py-2 text-end border-r border-slate-200 font-bold text-slate-700">Price</th>
                          <th className="px-3 py-2 text-center w-12 border-r border-slate-200 font-bold text-slate-700">Edit</th>
                          <th className="px-3 py-2 text-center w-12 font-bold text-slate-700">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantsList.map((v, i) => (
                          <tr key={i} className="border-b border-slate-100 transition-colors hover:bg-slate-50 font-bold text-slate-700">
                            <td className="px-3 py-2 border-r border-slate-100">
                              <div>{v.displayName}</div>
                              <div className="text-slate-400 text-[9px] font-normal">{v.itemName}</div>
                            </td>
                            <td className="px-3 py-2 border-r border-slate-100 text-end text-blue-600 font-black">₹{v.price.toFixed(2)}</td>
                            <td className="px-3 py-2 border-r border-slate-100 text-center">
                              <button onClick={() => editVariant(i)} className="text-blue-500 hover:text-blue-700 active:scale-90"><Edit2 size={13} /></button>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => removeVariant(i)} className="text-slate-300 hover:text-rose-500 active:scale-90"><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Pane: Addons */}
                <div className="col-span-4 border border-slate-200 rounded-sm overflow-hidden flex flex-col bg-slate-50/20">
                  <div className="bg-[#4ebcc3] px-3 py-1.5 text-white font-bold text-[10px] uppercase tracking-wider flex justify-between items-center">
                    <span>Addons</span>
                    <span className="bg-white/20 px-2 rounded-sm text-[9px]">{selectedAddons.length} SELECTED</span>
                  </div>
                  <div className="p-2 border-b border-slate-200 bg-white space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                      <input
                        type="text"
                        placeholder="Filter addons by name..."
                        value={addonSearch}
                        onChange={(e) => setAddonSearch(e.target.value)}
                        className="w-full h-8 border border-slate-300 rounded-sm pl-7 pr-2 text-xs outline-none focus:border-blue-300 font-medium"
                      />
                    </div>
                  </div>

                  {/* CHECKLIST: FIXED HEIGHT WITH SCROLL */}
                  <div className="h-[432px] overflow-y-auto no-scrollbar bg-white">
                    <div className="divide-y divide-slate-50">
                      {availableAddons
                        .filter(a => a.displayName.toLowerCase().includes(addonSearch.toLowerCase()))
                        .map(addon => {
                          const isSelected = selectedAddons.some(sa => sa.id === addon.id);
                          return (
                            <div
                              key={addon.id}
                              onClick={() => handleToggleAddon(addon)}
                              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-600 shadow-sm' : 'bg-white border-slate-300'}`}>
                                  {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-[10px] uppercase font-black tracking-tight ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {addon.displayName}
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 -mt-0.5">{addon.id}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  ₹{addon.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      {availableAddons.filter(a => a.displayName.toLowerCase().includes(addonSearch.toLowerCase())).length === 0 && (
                        <div className="p-12 text-center">
                          <AlertCircle size={24} className="text-slate-200 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Addons Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* FIND TAB */
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col overflow-hidden min-h-[625px]">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Search size={14} /> Search Records
                </h2>
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Find by Name</label>
                    <input
                      type="text"
                      value={findSearchTerm}
                      onChange={(e) => setFindSearchTerm(e.target.value)}
                      className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 shadow-inner"
                    />
                  </div>
                  <div className="col-span-8 flex justify-end gap-2">
                    <button onClick={handleFind} className="bg-[#7c8cfd] hover:bg-[#6a79e4] text-white h-8 px-6 rounded-md flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm">
                      <Search size={14} /> Find Now
                    </button>
                    <button onClick={handleResetFind} className="bg-[#fd7c7c] hover:bg-[#f35959] text-white h-8 px-6 rounded-md flex items-center gap-2 font-bold text-xs transition-all active:scale-95 shadow-sm">
                      <Eraser size={14} /> Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#fcfdff] border-b border-slate-200 sticky top-0 bg-white shadow-sm">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Display Name</th>
                      <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Type</th>
                      <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700 text-center">Variants/Contents</th>
                      <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700 text-center">Addons</th>
                      <th className="px-3 py-2 border-r border-slate-200 font-bold text-slate-700">Status</th>
                      <th className="px-3 py-2 font-bold text-slate-700 w-16 text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.length > 0 ? gridData.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 transition-all hover:bg-slate-50 font-bold text-slate-700">
                        <td className="px-3 py-2 border-r border-slate-100">{p.displayName}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-[9px] uppercase"><span className={`px-2 py-0.5 rounded-sm ${p.type === 'CHOICE_ITEM' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.type === 'CHOICE_ITEM' ? 'Choice Item' : 'Combo Item'}</span></td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">{p.variants.length}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">{p.addons.length}</td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => handleEditProduct(p)} className="text-blue-500 transition-all active:scale-95" title="Edit Record">
                            <FileText size={15} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr className="border-b border-slate-100 italic text-slate-400 text-center">
                        <td className="px-3 py-16" colSpan="6">No records discovered in the system</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Confirmation Modal for Type Change */}
      <AnimatePresence>
        {pendingTypeChange && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={cancelTypeChange} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-4 flex items-center gap-3 bg-amber-50 border-b border-amber-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Discard Changes?</h3>
                  <p className="text-[10px] font-bold text-slate-500">Unsaved variants and addons will be lost.</p>
                </div>
              </div>
              <div className="p-4 bg-white flex justify-end gap-2">
                <button onClick={cancelTypeChange} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmTypeChange} className="px-6 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-md hover:bg-rose-600 transition-all active:scale-95">
                  Discard & Change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductChoiceMaster;
