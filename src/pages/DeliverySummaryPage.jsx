import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Calendar, User,
  Filter, CheckCircle2, Clock, Wallet
} from 'lucide-react';
import { ordersDb, customersDb, deliveryAgentsDb } from '../data/mockDb';

const DeliverySummaryPage = () => {

  const navigate = useNavigate();
  const [personFilter, setPersonFilter] = useState('All Persons');
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL'); // Changed from statusFilter
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Transform ordersDb to the expected structure for delivery summary
    const deliveryOrders = ordersDb.filter(o => o.type === 'DE').map(o => {
      const customer = customersDb.find(c => c.id === o.customerId);
      const agent = deliveryAgentsDb.find(a => a.id === o.deliveryAgentId);
      return {
        ...o,
        person: agent?.name || '---',
        customer: customer?.name || '---',
        phone: customer?.mobile || '---',
        kotDateTime: o.dateTime,
        billDateTime: o.invoiceDate || '---',
        settlementDateTime: o.settlementTime || '---',
        amount: o.grandTotal || o.subTotal || 0,
        status: o.status
      };
    });
    setOrders(deliveryOrders);
  }, []);

  const filteredData = useMemo(() => {
    return orders.filter(item => { // Changed from deliveryData to orders
      const matchesPerson = personFilter === 'All Persons' || item.person === personFilter;
      const matchesStatus = filter === 'ALL' || item.status === filter; // Changed from statusFilter to filter

      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = !searchTerm || (
        item.person.toLowerCase().includes(searchTerm) ||
        item.kotNo.toLowerCase().includes(searchTerm) ||
        item.customer.toLowerCase().includes(searchTerm) ||
        item.phone.toLowerCase().includes(searchTerm) ||
        item.amount.toString().includes(searchTerm)
      );

      return matchesPerson && matchesStatus && matchesSearch;
    });
  }, [personFilter, filter, search, orders]); // Changed statusFilter to filter, deliveryData to orders

  const totalDelivery = filteredData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalSettled = filteredData
    .filter(d => d.status === 'SETTLED')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const getAgentDetails = (name) => {
    return deliveryAgentsDb.find(a => a.name === name) || {};
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fffcf5] p-6 overflow-hidden">
      {/* ... header remains same ... */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Delivery Summary</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#FFD93D]" /> RUNNING KOT</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#6BCB77]" /> SAVED KOT</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#4D96FF]" /> SETTLED KOT</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-[auto_auto_1fr] items-end gap-6 mb-8"> {/* Adjusted grid columns */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Delivery Person</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="h-11 w-44 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm appearance-none"
            >
              <option>All Persons</option>
              {deliveryAgentsDb.map(agent => (
                <option key={agent.id} value={agent.name}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date filter removed */}

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Status</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={filter} // Changed from statusFilter
              onChange={(e) => setFilter(e.target.value)} // Changed from setStatusFilter
              className="h-11 w-36 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm appearance-none"
            >
              <option>ALL</option> {/* Changed to ALL */}
              <option>RUNNING</option>
              <option>SAVED</option>
              <option>SETTLED</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 h-11">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-6 h-full flex flex-col justify-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-rose-400 -mb-1">Total Delivery</span>
            <span className="text-xl font-black text-rose-600 font-mono tracking-tight">{totalDelivery.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 h-full flex flex-col justify-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 -mb-1">Total Settled</span>
            <span className="text-xl font-black text-emerald-600 font-mono tracking-tight">{totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#334155] text-white">
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Agent</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Agent Mob / Vahan No</th>
              <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest border-r border-slate-600">KOT</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">KOT DT</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Customer</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Phone</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Bill DT</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Settlement DT</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-600">Status</th> {/* Added Status column */}
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest">Amount</th></tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const agent = getAgentDetails(item.person);
              return (
                <tr
                  key={item.id}
                  className={`border-b border-white transition-all hover:brightness-95 ${item.status === 'SAVED' ? 'bg-[#dcfce7]' :
                    item.status === 'RUNNING' ? 'bg-[#fef9c3]' :
                      item.status === 'SETTLED' ? 'bg-[#dbeafe]' : 'bg-white'
                    }`}
                >
                  <td className="px-5 py-3.5 text-sm font-black text-slate-700 border-r border-white/40">{item.person}</td>
                  <td className="px-5 py-3.5 text-[10px] font-bold text-slate-500 border-r border-white/40">
                    <div className="flex flex-col">
                      <span>{agent.mobile || '---'}</span>
                      <span className="text-[9px] text-slate-400">{agent.vahanNo || '---'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-black text-blue-600 border-r border-white/40">{item.kotNo}</td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-600 border-r border-white/40">{item.kotDateTime}</td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-700 border-r border-white/40">{item.customer}</td>
                  <td className="px-5 py-3.5 text-[11px] font-mono font-bold text-slate-500 border-r border-white/40">{item.phone}</td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-600 border-r border-white/40">{item.billDateTime}</td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-600 border-r border-white/40">{item.settlementDateTime}</td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-600 border-r border-white/40">{item.status}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-black text-slate-800">{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Grand Total</span>
        <span className="text-3xl font-black text-slate-800 font-mono tracking-tighter">
          {totalDelivery.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>

  );
};

export default DeliverySummaryPage;
