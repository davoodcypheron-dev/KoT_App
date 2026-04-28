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

const BRANCHES = [
  { id: 'B1', name: 'Antigravity Kitchen' },
  { id: 'B2', name: 'Main Branch' },
  { id: 'B3', name: 'Downtown Branch' }
];

const ProductChoiceMaster = () => {
  const { notify } = useApp();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState('save'); // 'save' or 'find'

  // Header States
  const [selectedBranch, setSelectedBranch] = useState('Antigravity Kitchen');
  const [productDisplayName, setProductDisplayName] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [status, setStatus] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Unified Product Structure (Option Groups)
  const [optionGroups, setOptionGroups] = useState([]);

  // Modal Visibility States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null); // ID of group being edited/added to
  const [editingItemId, setEditingItemId] = useState(null);


  // Group Modal Form States
  const [groupTitle, setGroupTitle] = useState('');
  const [groupType, setGroupType] = useState('CHOICE');
  const [groupMin, setGroupMin] = useState(1);
  const [groupMax, setGroupMax] = useState(1);

  // Item Modal Form States
  const [baseItemSearch, setBaseItemSearch] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [selectedBaseItem, setSelectedBaseItem] = useState(null);
  const [variantDisplayName, setVariantDisplayName] = useState('');
  const [variantPrice, setVariantPrice] = useState('0.00');
  const [itemQty, setItemQty] = useState('1');
  const [itemMinQty, setItemMinQty] = useState('1');
  const [itemMaxQty, setItemMaxQty] = useState('1');
  const [variantTaxIncluded, setVariantTaxIncluded] = useState(false);

  // Right Pane Addons States
  const [availableAddons, setAvailableAddons] = useState([]);
  const [addonSearch, setAddonSearch] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Find Section States
  const [findSearchTerm, setFindSearchTerm] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [gridData, setGridData] = useState([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 200 * 1024) {
        return notify('Upload Upto 200 KB Only!', 'error');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleOpenGroupModal = (group = null) => {
    if (group) {
      setEditingGroupId(group.id);
      setGroupTitle(group.title);
      setGroupType(group.type);
      setGroupMin(group.minSel);
      setGroupMax(group.maxSel);
    } else {
      setEditingGroupId(null);
      setGroupTitle('');
      setGroupType('CHOICE');
      setGroupMin(1);
      setGroupMax(1);
    }
    setShowGroupModal(true);
  };

  const handleSaveGroupModal = () => {
    if (!groupTitle.trim()) return notify('Please enter group title', 'error');

    if (editingGroupId) {
      // Update existing
      setOptionGroups(optionGroups.map(g => g.id === editingGroupId ? {
        ...g,
        title: groupTitle,
        type: groupType,
        minSel: groupMin,
        maxSel: groupMax
      } : g));
      notify('Group updated', 'success');
    } else {
      // Create new
      const newGroup = {
        id: Date.now().toString(),
        title: groupTitle,
        type: groupType,
        minSel: groupMin || 1,
        maxSel: groupMax || 1,
        items: []
      };
      setOptionGroups([...optionGroups, newGroup]);
      notify('Group added', 'success');
    }
    setShowGroupModal(false);
  };

  const handleRemoveGroup = (groupId) => {
    setOptionGroups(optionGroups.filter(g => g.id !== groupId));
    notify('Group removed', 'info');
  };

  const handleOpenItemModal = (groupId, item = null) => {
    setEditingGroupId(groupId);
    if (item) {
      setEditingItemId(item.id);
      setSelectedBaseItem({ id: item.itemId, name: item.itemName, price: item.price });
      setBaseItemSearch(`${item.itemId} - ${item.itemName}`);
      setVariantDisplayName(item.displayName);
      setVariantPrice(item.price.toFixed(2));
      setItemQty(item.qty.toString());
      setItemMinQty(item.minQty.toString());
      setItemMaxQty(item.maxQty.toString());
      setVariantTaxIncluded(item.taxIncluded);
    } else {
      setEditingItemId(null);
      setSelectedBaseItem(null);
      setBaseItemSearch('');
      setVariantDisplayName('');
      setVariantPrice('0.00');
      setItemQty('1');
      setItemMinQty('1');
      setItemMaxQty('1');
      setVariantTaxIncluded(false);
    }
    setShowItemModal(true);
  };

  const handleSaveItemModal = () => {
    if (!selectedBaseItem) return notify('Please select a base item', 'error');
    if (!variantDisplayName.trim()) return notify('Please enter display name', 'error');

    const price = parseFloat(variantPrice) || 0;
    const qty = parseInt(itemQty) || 1;

    const itemData = {
      itemId: selectedBaseItem.id,
      itemName: selectedBaseItem.name,
      displayName: variantDisplayName,
      price: price,
      taxIncluded: variantTaxIncluded,
      qty: qty,
      minQty: parseInt(itemMinQty) || 1,
      maxQty: parseInt(itemMaxQty) || 1
    };

    setOptionGroups(optionGroups.map(g => {
      if (g.id === editingGroupId) {
        if (editingItemId) {
          return {
            ...g,
            items: g.items.map(i => i.id === editingItemId ? { ...i, ...itemData } : i)
          };
        } else {
          return {
            ...g,
            items: [...g.items, { ...itemData, id: Date.now().toString() }]
          };
        }
      }
      return g;
    }));

    notify(editingItemId ? 'Item updated' : 'Item added to group', 'success');
    setShowItemModal(false);
  };

  const handleRemoveItemFromGroup = (groupId, itemId) => {
    setOptionGroups(optionGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(i => i.id !== itemId) };
      }
      return g;
    }));
  };

  const handleToggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.some(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };
  const handleSave = async () => {
    if (!productDisplayName.trim()) return notify('Please enter display name', 'error');
    if (optionGroups.length === 0 && selectedAddons.length === 0) {
      return notify('Please add at least one group or addon', 'error');
    }

    const productData = {
      type: 'COMBO_ITEM',
      displayName: productDisplayName,
      image: productImage,
      branch: selectedBranch,
      status: status ? 'Active' : 'Inactive',
      optionGroups: optionGroups,
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

  const handleClear = () => {
    setProductDisplayName('');
    setProductImage(null);
    setSelectedBranch('Antigravity Kitchen');
    setStatus(true);
    setOptionGroups([]);
    setSelectedAddons([]);
    setEditingId(null);
    setEditingGroupId(null);
    setBaseItemSearch('');
    setVariantDisplayName('');
    setVariantPrice('0.00');
    setItemQty('1');
    setItemMinQty('1');
    setItemMaxQty('1');
    setVariantTaxIncluded(false);
    notify('Form cleared', 'info');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFind = () => {
    const filtered = productsList.filter(p => {
      const matchName = p.displayName.toLowerCase().includes(findSearchTerm.toLowerCase());
      const matchBranch = p.branch === selectedBranch || !p.branch; // Show if matches current branch or legacy
      return matchName; // For now keeping it simple
    });
    setGridData(filtered);
    notify(`Found ${filtered.length} records`, 'success');
  };

  const handleResetFind = () => {
    setFindSearchTerm('');
    setGridData(productsList);
  };

  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setProductDisplayName(product.displayName);
    setProductImage(product.image || null);
    setSelectedBranch(product.branch || 'Antigravity Kitchen');
    setStatus(product.status === 'Active');

    // Legacy support: if product has variants instead of optionGroups
    if (product.variants && !product.optionGroups) {
      const legacyGroup = {
        id: 'legacy',
        title: product.type === 'CHOICE_ITEM' ? 'Variants' : 'Contents',
        type: product.type === 'CHOICE_ITEM' ? 'CHOICE' : 'FIXED',
        minSel: 1,
        maxSel: 1,
        items: product.variants.map(v => ({ ...v, id: Math.random().toString() }))
      };
      setOptionGroups([legacyGroup]);
    } else {
      setOptionGroups(product.optionGroups || []);
    }

    setSelectedAddons(product.addons || []);
    setActiveTab('save');
    notify('Product loaded for editing', 'info');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fbf2f2] overflow-hidden">
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
            <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-sm">
              <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Save</h2>
              </div>
              <div className="p-3">

                <div className="grid grid-cols-12 gap-3 mb-2 items-end">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Branch *</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 bg-white shadow-sm font-bold text-slate-700"
                    >
                      {BRANCHES.map(branch => (
                        <option key={branch.id} value={branch.name}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Product Display Name *</label>
                    <input
                      type="text"
                      value={productDisplayName}
                      onChange={(e) => setProductDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full h-8 border border-slate-300 rounded-sm px-2 text-xs outline-none focus:border-blue-400 font-bold"
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Status</label>
                    <div className="flex items-center h-8">
                      <button
                        onClick={() => setStatus(!status)}
                        className={`w-20 h-7 border border-slate-300 flex items-center relative overflow-hidden transition-all duration-300 ${status ? 'bg-[#e6f3ff]' : 'bg-white'}`}
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
                  <div className="col-span-1 flex flex-col items-center">
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="w-[60px] h-[60px] border border-slate-300 rounded-sm flex items-center justify-center cursor-pointer hover:border-blue-400 bg-white shadow-sm overflow-hidden"
                      >
                        {productImage ? (
                          <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <LayersIcon size={24} className="text-blue-500" />
                        )}
                      </label>
                      {productImage && (
                        <button
                          onClick={() => setProductImage(null)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-red-600 mt-1 uppercase leading-tight text-center">
                      Upload Upto 200 KB Only!
                    </span>
                  </div>
                  <div className="col-span-4 flex justify-end gap-2">
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
                  {/* Left Pane: Option Groups Management */}
                  <div className="col-span-8 flex flex-col gap-3 min-h-[500px]">
                    {/* Groups Header & Add Button */}
                    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-sm">
                      <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Option Groups</h3>
                        </div>
                        <button
                          onClick={() => handleOpenGroupModal()}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-4 rounded-md flex items-center gap-2 font-bold text-[9px] transition-all active:scale-95 shadow-sm"
                        >
                          <Plus size={12} /> Add New Group
                        </button>
                      </div>
                      <div className="p-2 bg-slate-50 border-b border-slate-200">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          Define choices and fixed items for this product
                        </p>
                      </div>
                    </div>

                    {/* Groups List */}
                    <div className="flex-1 space-y-3 pb-4 overflow-y-auto no-scrollbar max-h-[620px]">
                      {optionGroups.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-12 text-center">
                          <Package size={40} className="text-slate-200 mx-auto mb-3" />
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No groups added yet</p>
                          <p className="text-[10px] text-slate-300 mt-1">Click "Add New Group" to get started</p>
                        </div>
                      ) : (
                        optionGroups.map((group, gIdx) => (
                          <div key={group.id} className="bg-white border border-slate-200 rounded-lg shadow-sm transition-all overflow-hidden flex flex-col">
                            {/* Group Header */}
                            <div className="bg-[#f8fafc] px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                                  {gIdx + 1}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{group.title}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${group.type === 'CHOICE' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                      {group.type}
                                    </span>
                                    {group.type === 'CHOICE' && (
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        SEL: {group.minSel}-{group.maxSel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenItemModal(group.id)}
                                  className="bg-slate-800 hover:bg-slate-900 text-white h-7 px-3 rounded text-[9px] font-black uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                >
                                  <Plus size={12} /> Add Item
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <button onClick={() => handleOpenGroupModal(group)} className="text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-200 p-1 rounded shadow-sm">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => handleRemoveGroup(group.id)} className="text-slate-400 hover:text-rose-500 transition-colors bg-white border border-slate-200 p-1 rounded shadow-sm">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Group Items Table */}
                            <div className="overflow-x-auto min-h-[60px]">
                              <table className="w-full text-[10px] border-collapse">
                                <thead className="bg-[#f2f2f2] border-b border-slate-300">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-bold text-slate-700 text-[9px] uppercase tracking-tight">Base/Display Item</th>
                                    <th className="px-3 py-2 text-end font-bold text-slate-700 text-[9px] uppercase tracking-tight">Price</th>
                                    <th className="px-3 py-2 text-center font-bold text-slate-700 text-[9px] uppercase tracking-tight">Def</th>
                                    <th className="px-3 py-2 text-center font-bold text-slate-700 text-[9px] uppercase tracking-tight">Min</th>
                                    <th className="px-3 py-2 text-center font-bold text-slate-700 text-[9px] uppercase tracking-tight">Max</th>
                                    <th className="px-3 py-2 text-center font-bold text-slate-700 text-[9px] uppercase tracking-tight">Tax</th>
                                    <th className="px-3 py-2 text-center font-bold text-slate-700 text-[9px] uppercase tracking-tight w-10"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items.map((item, iIdx) => (
                                    <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                                      <td className="px-3 py-2">
                                        <div className="font-black text-slate-700 leading-tight">{item.displayName}</div>
                                        <div className="text-[8px] text-slate-400 font-bold tracking-tight uppercase leading-none mt-0.5">{item.itemName}</div>
                                      </td>
                                      <td className="px-3 py-2 text-end font-black text-blue-600">₹{item.price.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-center font-black text-slate-600">{item.qty}</td>
                                      <td className="px-3 py-2 text-center font-bold text-slate-400">{item.minQty}</td>
                                      <td className="px-3 py-2 text-center font-bold text-slate-400">{item.maxQty}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`text-[8px] font-black px-1 rounded ${item.taxIncluded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                          {item.taxIncluded ? 'INC' : 'EXL'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-end opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={() => handleOpenItemModal(group.id, item)}
                                            className="text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-100 p-1 rounded"
                                            title="Edit Item"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                          <button
                                            onClick={() => handleRemoveItemFromGroup(group.id, item.id)}
                                            className="text-slate-300 hover:text-rose-500 transition-colors bg-white border border-slate-100 p-1 rounded"
                                            title="Remove Item"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {group.items.length === 0 && (
                                    <tr>
                                      <td colSpan="4" className="px-4 py-8 text-center text-slate-300 font-bold text-[9px] uppercase tracking-widest italic bg-slate-50/30">
                                        No items added to this group yet
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Pane: Addons */}
                  <div className="col-span-4 border border-slate-200 rounded-sm overflow-hidden flex flex-col bg-slate-50/20">
                    <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300 text-slate-800 font-bold text-[10px] uppercase tracking-wider flex justify-between items-center">
                      <span>Addons</span>
                      <span className="bg-slate-800/10 px-2 rounded-sm text-[9px]">{selectedAddons.length} SELECTED</span>
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
          </div>
        ) : (
          /* FIND TAB */
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col overflow-hidden min-h-[625px]">
              <div className="bg-[#fcf4d9] px-3 py-1.5 border-b border-slate-300">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Find</h2>
              </div>
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
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
                  <thead className="bg-[#f2f2f2] border-b border-slate-300 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800 w-16 text-center">Image</th>
                      <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800">Display Name</th>
                      <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800">Type</th>
                      <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800 text-center">Variants/Contents</th>
                      <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800 text-center">Addons</th>
                      <th className="px-3 py-2 border-r border-slate-300 font-bold text-slate-800">Status</th>
                      <th className="px-3 py-2 font-bold text-slate-800 w-16 text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.length > 0 ? gridData.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 transition-all hover:bg-slate-50 font-bold text-slate-700">
                        <td className="px-3 py-2 border-r border-slate-100 flex items-center justify-center">
                          <div className="w-10 h-10 border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center bg-white shadow-sm">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <LayersIcon size={16} className="text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <div>{p.displayName}</div>
                          <div className="text-[9px] text-blue-500 uppercase tracking-tighter">{p.branch || 'Default Branch'}</div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-[9px] uppercase">
                          <div className="flex flex-wrap gap-1">
                            {p.optionGroups ? p.optionGroups.map((g, idx) => (
                              <span key={idx} className={`px-1.5 py-0.5 rounded-sm ${g.type === 'CHOICE' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {g.title}
                              </span>
                            )) : <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">Legacy</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">{p.optionGroups?.length || 0} Groups</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">{p.addons?.length || 0}</td>
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
                        <td className="px-3 py-16" colSpan="7">No records discovered in the system</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modals Container */}
      <AnimatePresence>
        {/* GROUP SETTINGS MODAL */}
        {showGroupModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGroupModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-[#fcfdff] p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{editingGroupId ? 'Edit Group Settings' : 'Create New Option Group'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define group properties and rules</p>
                  </div>
                </div>
                <button onClick={() => setShowGroupModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Group Name / Title *</label>
                  <input
                    type="text"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="e.g., Choose your Drink"
                    className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 bg-slate-50 transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Group Type</label>
                    <div className="flex h-10 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <button onClick={() => setGroupType('CHOICE')} className={`flex-1 rounded-md text-[10px] font-black uppercase transition-all ${groupType === 'CHOICE' ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-500'}`}>Choice</button>
                      <button onClick={() => setGroupType('FIXED')} className={`flex-1 rounded-md text-[10px] font-black uppercase transition-all ${groupType === 'FIXED' ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-500'}`}>Fixed</button>
                    </div>
                  </div>
                  {groupType === 'CHOICE' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min</label>
                        <input type="number" value={groupMin} onChange={(e) => setGroupMin(parseInt(e.target.value))} className="w-full h-10 border border-slate-200 rounded-lg px-2 text-xs text-center font-black text-blue-600 outline-none focus:border-blue-400 bg-slate-50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max</label>
                        <input type="number" value={groupMax} onChange={(e) => setGroupMax(parseInt(e.target.value))} className="w-full h-10 border border-slate-200 rounded-lg px-2 text-xs text-center font-black text-blue-600 outline-none focus:border-blue-400 bg-slate-50" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowGroupModal(false)} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleSaveGroupModal} className="px-10 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Save Group</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ITEM MODAL */}
        {showItemModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-[#fcfdff] p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Plus size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Add Item to Group</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search and customize base item</p>
                  </div>
                </div>
                <button onClick={() => setShowItemModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Row 1: Base Item and Display Name */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Base Item *</label>
                    <input
                      type="text"
                      placeholder="Search base item..."
                      value={baseItemSearch}
                      onChange={(e) => { setBaseItemSearch(e.target.value); setShowItemSuggestions(true); }}
                      onFocus={() => setShowItemSuggestions(true)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 bg-slate-50 transition-all font-bold"
                    />
                    <AnimatePresence>
                      {showItemSuggestions && baseItemSearch.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowItemSuggestions(false)} />
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-20 max-h-48 overflow-y-auto rounded-lg no-scrollbar">
                            {filteredBaseItems.length > 0 ? filteredBaseItems.map(item => (
                              <button key={item.id} onClick={() => handleSelectBaseItem(item)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors">
                                <div className="text-[10px] font-black text-slate-800">{item.name}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.id} • ₹{item.price}</div>
                              </button>
                            )) : <div className="p-4 text-center text-slate-300 text-[10px] font-bold">No items found</div>}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="col-span-6 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Name *</label>
                    <input
                      type="text"
                      value={variantDisplayName}
                      onChange={(e) => setVariantDisplayName(e.target.value)}
                      placeholder="Name on customer menu"
                      className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 bg-slate-50 transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Row 2: Price and Quantities */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rate / Price *</label>
                    <input
                      type="text"
                      value={variantPrice}
                      onChange={(e) => setVariantPrice(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs text-end font-black text-blue-600 outline-none focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Qty *</label>
                    <input
                      type="number"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs text-center font-black text-slate-700 outline-none focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min Qty *</label>
                    <input
                      type="number"
                      value={itemMinQty}
                      onChange={(e) => setItemMinQty(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs text-center font-black text-slate-700 outline-none focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Qty *</label>
                    <input
                      type="number"
                      value={itemMaxQty}
                      onChange={(e) => setItemMaxQty(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-lg px-4 text-xs text-center font-black text-slate-700 outline-none focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Row 3: Tax Selection */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tax Included</label>
                  <button
                    onClick={() => setVariantTaxIncluded(!variantTaxIncluded)}
                    className={`w-24 h-8 border border-slate-300 flex items-center relative overflow-hidden transition-all duration-300 ${variantTaxIncluded ? 'bg-[#e6f3ff]' : 'bg-white'}`}
                  >
                    {variantTaxIncluded ? (
                      <>
                        <span className="flex-1 text-center text-[10px] font-black uppercase text-slate-700">Yes</span>
                        <div className="w-2.5 h-full bg-[#0078d4]" />
                      </>
                    ) : (
                      <>
                        <div className="w-2.5 h-full bg-slate-600" />
                        <span className="flex-1 text-center text-[10px] font-black uppercase text-slate-700">No</span>
                      </>
                    )}
                  </button>
                  <p className="text-[9px] text-slate-400 font-bold leading-tight uppercase">Whether price includes GST by default</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowItemModal(false)} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleSaveItemModal} className="px-10 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Add to Group</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductChoiceMaster;
