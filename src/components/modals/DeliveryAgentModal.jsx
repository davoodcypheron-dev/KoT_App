import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, X, User, Phone, CheckCircle2 } from 'lucide-react';
import { deliveryAgentsDb } from '../../data/mockDb';

const DeliveryAgentModal = ({ isOpen, onClose, selectedAgent, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Select Agent</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mandatory for Delivery</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3">
          {deliveryAgentsDb.map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                onSelect(agent);
                onClose();
              }}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                selectedAgent?.id === agent.id
                  ? 'bg-sky-600 border-sky-700 text-white shadow-lg'
                  : 'bg-slate-50 border-slate-100 hover:border-sky-200 hover:bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedAgent?.id === agent.id ? 'bg-white/20' : 'bg-white text-sky-500 shadow-sm'
                }`}>
                  <User size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-xs uppercase tracking-tight">{agent.name}</p>
                  <p className={`text-[10px] font-bold ${selectedAgent?.id === agent.id ? 'text-sky-100' : 'text-slate-400'}`}>
                    {agent.mobile} • {agent.vahanNo}
                  </p>
                </div>
              </div>
              {selectedAgent?.id === agent.id && (
                <CheckCircle2 size={20} className="text-white" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 italic text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Please select an agent to finalize delivery</p>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryAgentModal;
