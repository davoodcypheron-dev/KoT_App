
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Tag, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { customersDb } from '../../data/meta_data';
import { saveCustomer, getAllCustomers } from '../../data/idb';

const CustomerModal = ({ isOpen, onClose, onSuccess }) => {
  const { selectedCustomer, setSelectedCustomer, config, notify } = useApp();
  const [custName, setCustName] = useState(selectedCustomer?.name || '');
  const [custMobile, setCustMobile] = useState(selectedCustomer?.mobile || '');
  const [custAddress, setCustAddress] = useState(selectedCustomer?.address || '');
  const [regNo, setRegNo] = useState(selectedCustomer?.regNo || '');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [dbCustomers, setDbCustomers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setCustName(selectedCustomer?.name || '');
      setCustMobile(selectedCustomer?.mobile || '');
      setCustAddress(selectedCustomer?.address || '');
      setRegNo(selectedCustomer?.regNo || '');
      
      getAllCustomers().then(data => setDbCustomers(data || []));
    }
  }, [isOpen, selectedCustomer]);

  useEffect(() => {
    const term = custName || custMobile;
    if (term.length > 0) {
      const combined = [...customersDb, ...dbCustomers];
      const unique = combined.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) return acc.concat([current]);
        else return acc;
      }, []);

      setFilteredSuggestions(unique.filter(c =>
        c.name.toLowerCase().includes(term.toLowerCase()) ||
        c.mobile.includes(term)
      ).slice(0, 5));
    } else {
      setFilteredSuggestions([]);
    }
  }, [custName, custMobile, dbCustomers]);

  const handleSelectCustomer = (c) => {
    setCustName(c.name);
    setCustMobile(c.mobile);
    setCustAddress(c.address);
    setRegNo(c.regNo || '');
    setSelectedCustomer(c);
    setShowSuggestions(false);
    if (onSuccess) onSuccess(c);
  };

  const handleManualSave = async () => {
    const newCust = {
      id: selectedCustomer?.id || "CUST_" + Date.now(),
      name: custName,
      mobile: custMobile,
      address: custAddress,
      regNo: regNo
    };
    
    await saveCustomer(newCust);
    setSelectedCustomer(newCust);
    if (onSuccess) onSuccess(newCust);
    notify('Customer Record Updated', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Customer Details</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Info</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Customer Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => { setCustName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Enter Name..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                />
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && (custName || custMobile) && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                  >
                    {filteredSuggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectCustomer(s)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-all text-left"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{s.mobile}</span>
                        </div>
                        <Search size={14} className="text-slate-300" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  value={custMobile}
                  onChange={(e) => { setCustMobile(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Enter Mobile..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-300" size={16} />
                <textarea
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Enter Address..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner h-24 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Reg. No</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Enter Registration No..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleManualSave}
              className="flex-[2] py-4 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
            >
              Update Customer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CustomerModal;
