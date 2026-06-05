import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, Search, Save, AlertCircle } from 'lucide-react';
import { 
  getAllFromStore, saveToStore, deleteFromStore,
  USERS_STORE, TABLES_STORE, ITEMS_STORE, CUSTOMERS_STORE,
  WAITERS_STORE, DELIVERY_AGENTS_STORE, UNITS_STORE,
  PAYMENT_METHODS_STORE, MULTI_PAY_TYPES_STORE, LEDGERS_STORE,
  GROUPS_STORE, FLOORS_STORE, AUTH_USERS_STORE, COOKING_INSTRUCTIONS_STORE
} from '../../data/idb';
import { loadDbIntoMemoryCache } from '../../data/dbInitializer';
import * as mockBase from '../../data/mockDb';

export const ENTITY_CONFIG = {
  USERS: {
    title: 'Manage Staff & Users', store: USERS_STORE,
    columns: [{ key: 'id', label: 'ID' }, { key: 'user', label: 'Username' }, { key: 'role', label: 'Role' }],
    formKeys: [
      { key: 'id', label: 'User ID', type: 'text', required: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'pass', label: 'Password', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', options: [{id: 'Admin', name: 'Admin'}, {id: 'Manager', name: 'Manager'}, {id: 'User', name: 'User'}], required: true },
      { key: 'waiterId', label: 'Linked Waiter', type: 'selectDb', source: 'waitersDb' },
      { key: 'kotRateEditable', label: 'Can Edit Rates', type: 'checkbox' },
      { key: 'allowOpenItemSettle', label: 'Allow Open Items', type: 'checkbox' }
    ]
  },
  WAITERS: {
    title: 'Manage Waiters', store: WAITERS_STORE,
    columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }],
    formKeys: [
        { key: 'id', label: 'Waiter ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'pass', label: 'PIN / Password', type: 'text', required: true },
        { key: 'isAllowedKotCancel', label: 'Can Cancel KOT?', type: 'checkbox' }
    ]
  },
  DELIVERY_AGENTS: {
    title: 'Delivery Agents', store: DELIVERY_AGENTS_STORE,
    columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'mobile', label: 'Mobile' }],
    formKeys: [
        { key: 'id', label: 'Agent ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'mobile', label: 'Mobile', type: 'text' },
        { key: 'vahanNo', label: 'Vehicle No', type: 'text' }
    ]
  },
  TABLES: {
    title: 'Manage Tables', store: TABLES_STORE,
    columns: [{ key: 'id', label: 'Table ID' }, { key: 'floor', label: 'Floor' }],
    formKeys: [
       { key: 'id', label: 'Table ID', type: 'text', required: true },
       { key: 'floor', label: 'Floor mapping', type: 'selectDb', source: 'floorsDb', required: true },
       { key: 'status', label: 'Initial Status', type: 'select', options: [{id: 'vacant', name: 'Vacant'}, {id: 'occupied', name: 'Occupied'}] }
    ]
  },
  FLOORS: {
    title: 'Floor Management', store: FLOORS_STORE,
    columns: [{ key: 'id', label: 'Floor ID' }, { key: 'name', label: 'Floor Name' }],
    formKeys: [{ key: 'id', type: 'text', label: 'Floor ID', required: true }, { key: 'name', type: 'text', label: 'Floor Name' }]
  },
  UNITS: {
    title: 'Measurement Units', store: UNITS_STORE,
    columns: [{ key: 'id', label: 'Unit ID' }, { key: 'name', label: 'Name' }, { key: 'decimals', label: 'Decimals' }],
    formKeys: [
        { key: 'id', label: 'Unit ID', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'decimals', label: 'Decimal Places', type: 'number' }
    ]
  },
  GROUPS: {
     title: 'Menu Groups', store: GROUPS_STORE,
     columns: [{ key: 'id', label: 'Group ID' }, { key: 'name', label: 'Name' }],
     formKeys: [{ key: 'id', label: 'Group ID', type: 'text', required: true }, { key: 'name', label: 'Name', type: 'text', required: true }]
  },
  ITEMS: {
    title: 'Manage Menu Items', store: ITEMS_STORE,
    columns: [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Item Name' }, { key: 'price', label: 'Price (₹)' }],
    formKeys: [
       { key: 'id', label: 'Item Code', type: 'text', required: true },
       { key: 'name', label: 'Item Name', type: 'text', required: true },
       { key: 'arName', label: 'Arabic Name', type: 'text' },
       { key: 'price', label: 'Price', type: 'number', required: true },
       { key: 'groupId', label: 'Menu Group', type: 'selectDb', source: 'groupsDb' },
       { key: 'unitId', label: 'Unit', type: 'selectDb', source: 'unitsDb' },
       { key: 'dietType', label: 'Diet (veg/non-veg/egg)', type: 'select', options: [{id: 'veg', name: 'Veg'}, {id: 'non-veg', name: 'Non Veg'}, {id: 'egg', name: 'Egg'}] },
       { key: 'openItem', label: 'Is Open Item', type: 'checkbox' },
       { key: 'image', label: 'Image URL', type: 'text' }
    ]
  },
  CUSTOMERS: {
    title: 'Manage Customers', store: CUSTOMERS_STORE,
    columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'mobile', label: 'Mobile' }],
    formKeys: [
       { key: 'id', label: 'Customer ID', type: 'text', required: true },
       { key: 'name', label: 'Name', type: 'text', required: true },
       { key: 'mobile', label: 'Mobile Number', type: 'text', required: true },
       { key: 'address', label: 'Address', type: 'text' },
       { key: 'regNo', label: 'Registration No', type: 'text' }
    ]
  },
  PAYMENT_METHODS: {
      title: 'Payment Methods', store: PAYMENT_METHODS_STORE,
      columns: [{ key: 'id', label: 'Method ID' }, { key: 'name', label: 'Name' }, { key: 'priority', label: 'Priority' }],
      formKeys: [
          { key: 'id', label: 'ID', type: 'text', required: true },
          { key: 'name', label: 'Payment Name', type: 'text', required: true },
          { key: 'priority', label: 'Sort Priority', type: 'number', required: true },
          { key: 'isOnline', label: 'Is Online Transaction', type: 'checkbox' }
      ]
  },
  MULTI_PAY_TYPES: {
       title: 'Multi Pay Types', store: MULTI_PAY_TYPES_STORE,
       columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'priority', label: 'Priority' }],
       formKeys: [
           { key: 'id', label: 'ID', type: 'text', required: true },
           { key: 'name', label: 'Name', type: 'text', required: true },
           { key: 'priority', label: 'Sort Priority', type: 'number', required: true },
           { key: 'defaultMethod', label: 'Default Method', type: 'selectDb', source: 'paymentMethodsDb' },
           { key: 'allowMultiple', label: 'Allow Multiple', type: 'checkbox' }
       ]
  },
  LEDGERS: {
       title: 'Ledgers', store: LEDGERS_STORE,
       columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Ledger Name' }],
       formKeys: [
           { key: 'id', label: 'ID', type: 'text', required: true },
           { key: 'name', label: 'Ledger Name', type: 'text', required: true }
       ]
  },
  AUTH_USERS: {
       title: 'Auth User Access', store: AUTH_USERS_STORE,
       columns: [{ key: 'id', label: 'User ID' }, { key: 'cancelKot', label: 'Cancel Access' }],
       formKeys: [
           { key: 'id', label: 'User ID', type: 'selectDb', source: 'usersDb', required: true },
           { key: 'cancelKot', label: 'Can Cancel KOT', type: 'checkbox' }
       ]
  },
  COOKING_INSTRUCTIONS: {
    title: 'Cooking Instructions', store: COOKING_INSTRUCTIONS_STORE,
    columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Instruction' }],
    formKeys: [
       { key: 'id', label: 'ID', type: 'text', required: true },
       { key: 'name', label: 'Instruction Text', type: 'text', required: true }
    ]
  }
};

const EntityManagerModal = ({ isOpen, onClose, entityType }) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const config = ENTITY_CONFIG[entityType];

  useEffect(() => {
    if (isOpen && config) {
      loadData();
    }
  }, [isOpen, entityType]);

  const loadData = async () => {
    if (!config) return;
    try {
      let result = await getAllFromStore(config.store);
      
      // Self-heal legacy primitive string arrays (e.g. old cooking instructions)
      if (result && result.length > 0 && typeof result[0] === 'string') {
          result = result.map((item, idx) => ({ id: `LEGACY_ID_${idx}`, name: item }));
      }

      setData(result || []);
    } catch (e) {
      console.error("Failed loading data", e);
    }
  };

  const handleAddNew = () => {
    const newForm = {};
    config.formKeys.forEach(k => {
      newForm[k.key] = k.type === 'checkbox' ? false : '';
    });
    if (entityType === 'TABLES') newForm.status = 'vacant';

    setFormData(newForm);
    setEditingItem('NEW');
  };

  const handleEdit = (item) => {
    setFormData({ ...item });
    setEditingItem(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteFromStore(config.store, id);
      await loadData();
      await loadDbIntoMemoryCache(); 
    }
  };

  const handleSave = async () => {
    if (!formData.id) {
        alert("ID field is mandatory!");
        return;
    }
    const finalData = { ...formData };
    config.formKeys.forEach(k => {
       if (k.type === 'number') finalData[k.key] = parseFloat(finalData[k.key]) || 0;
    });

    await saveToStore(config.store, finalData);
    await loadData();
    await loadDbIntoMemoryCache(); 
    setEditingItem(null);
  };

  const renderField = (field) => {
    if (field.type === 'checkbox') {
       return (
          <button 
             onClick={() => setFormData({...formData, [field.key]: !formData[field.key]})}
             className={`w-10 h-5 rounded-full transition-colors relative ${formData[field.key] ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
             <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData[field.key] ? 'translate-x-5' : ''}`} />
          </button>
       );
    }

    if (field.type === 'select') {
       return (
         <select
            value={formData[field.key] !== undefined ? formData[field.key] : ''}
            onChange={e => setFormData({...formData, [field.key]: e.target.value})}
            className="w-full h-9 px-3 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none transition-colors bg-white font-medium"
         >
            <option value="">-- Select --</option>
            {field.options.map(opt => (
               <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
         </select>
       );
    }

    if (field.type === 'selectDb') {
       // Pull from mockDb cache directly (it's loaded at startup)
       const dbArray = mockBase[field.source] || [];
       return (
         <select
            value={formData[field.key] !== undefined ? formData[field.key] : ''}
            onChange={e => setFormData({...formData, [field.key]: e.target.value})}
            className="w-full h-9 px-3 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none transition-colors bg-white font-medium disabled:bg-slate-100"
         >
            <option value="">-- Select {field.label} --</option>
            {dbArray.map(opt => (
               <option key={opt.id} value={opt.id}>
                  {opt.name || opt.user || opt.id}
               </option>
            ))}
         </select>
       );
    }

    // Default: text, number
    return (
      <input 
         type={field.type}
         value={formData[field.key] !== undefined ? formData[field.key] : ''}
         onChange={e => setFormData({...formData, [field.key]: e.target.value})}
         disabled={editingItem !== 'NEW' && field.key === 'id'} 
         className="w-full h-9 px-3 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none transition-colors bg-white disabled:bg-slate-100 disabled:text-slate-400 font-medium"
      />
    );
  };

  const filteredData = data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !config) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-black text-slate-800">{config.title}</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{data.length} records found</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
             
            {/* List View */}
            <div className={`flex-1 flex flex-col ${editingItem ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b border-slate-100 flex gap-2">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search records..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all font-medium placeholder:text-slate-400"
                    />
                 </div>
                 <button 
                  onClick={handleAddNew}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                 >
                    <Plus size={14} /> Add New
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {filteredData.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${editingItem === item.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                       <div className="flex-1 min-w-0 pr-4 flex gap-4 overflow-hidden">
                          {config.columns.map((col, idx) => (
                             <div key={col.key} className={idx === 0 ? "font-black text-xs text-slate-700 w-20 truncate" : "text-xs font-medium text-slate-600 flex-1 truncate"}>
                               {item[col.key]}
                             </div>
                          ))}
                       </div>
                       <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors">
                             <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition-colors">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                 ))}
                 {filteredData.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                       <AlertCircle size={32} className="mb-2 opacity-50" />
                       <span className="text-xs font-bold uppercase tracking-wider">No records found</span>
                    </div>
                 )}
              </div>
            </div>

            {/* Edit Form View */}
            {editingItem && (
               <div className="w-full md:w-96 border-l border-slate-100 bg-slate-50/50 flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                     <span className="font-black text-sm text-slate-800">
                        {editingItem === 'NEW' ? 'Create Record' : 'Edit Record'}
                     </span>
                     <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                        <X size={16} />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {config.formKeys.map(field => (
                        <div key={field.key} className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                              <span>{field.label} {field.required && <span className="text-rose-500">*</span>}</span>
                           </label>
                           {renderField(field)}
                        </div>
                     ))}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                     <button 
                        onClick={handleSave}
                        className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-sm"
                     >
                        <Save size={16} /> Save Record
                     </button>
                  </div>
               </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EntityManagerModal;
