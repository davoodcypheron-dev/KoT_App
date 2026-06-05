
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Check, Gift, ShoppingBag, ArrowRight, Percent, Star, ChevronRight, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { offersDb, itemsDb } from '../../data/mockDb';

const isOfferValid = (offer) => {
   const now = new Date();
   const today = now.toLocaleDateString('en-US', { weekday: 'long' });
   const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

   if (offer.status !== 'active') return { valid: false, reason: 'Inactive' };

   if (offer.startDate && new Date(offer.startDate) > now) return { valid: false, reason: 'Offer starting soon' };
   if (offer.endDate && new Date(offer.endDate + 'T23:59:59') < now) return { valid: false, reason: 'Offer expired', expired: true };

   if (offer.validDays && !offer.validDays.includes(today)) return { valid: false, reason: `Available on ${offer.validDays.join(', ')}` };

   if (offer.startTime && currentTime < offer.startTime) return { valid: false, reason: `Starts at ${offer.startTime}` };
   if (offer.endTime && currentTime > offer.endTime) return { valid: false, reason: `Available until ${offer.endTime}` };

   return { valid: true };
};

const OfferModal = ({ isOpen, onClose, cart, appliedOffers, onApplyOffer, onRemoveOffer, calculateTotal, currencySymbol, config, onDone }) => {
   const [selectedItem, setSelectedItem] = useState(null);
   const [activeTab, setActiveTab] = useState('item'); // 'item' or 'bill'

   if (!isOpen) return null;

   const taxRate = config?.taxRate || 0;
   const grossTotal = calculateTotal();
   const totalWithTax = grossTotal * (1 + taxRate / 100);

   const cartItems = cart.reduce((acc, item) => {
      const existing = acc.find(i => i.id === item.id);
      if (existing) {
         existing.totalQty += item.qty;
      } else {
         acc.push({ ...item, totalQty: item.qty });
      }
      return acc;
   }, []);

   const getValidOffers = (type, itemId = null, qty = 0) => {
      return offersDb.filter(offer => {
         // Filter by basic type
         if (type === 'item') {
            if (offer.type === 'FREE_ITEM' && offer.buyItemId !== itemId) return false;
            if (offer.type === 'ITEM_DISCOUNT_PERCENT' && offer.targetItemId !== itemId) return false;
            // Only show item-wise types in item tab
            if (!['FREE_ITEM', 'ITEM_DISCOUNT_PERCENT'].includes(offer.type)) return false;
         } else {
            if (!offer.type.startsWith('BILL_AMOUNT_')) return false;
         }

         const validation = isOfferValid(offer);
         if (validation.expired) return false;

         return true;
      });
   };

   const itemsWithOffers = cartItems.filter(item => getValidOffers('item', item.id, item.totalQty).length > 0);
   const billOffers = getValidOffers('bill');

   const handleApply = (offer, targetItem = null) => {
      onApplyOffer(offer, targetItem);
   };

   const sortOffers = (offers, type, item = null) => {
      return [...offers].sort((a, b) => {
         const aApp = isApplied(a.id);
         const bApp = isApplied(b.id);
         if (aApp && !bApp) return -1;
         if (!aApp && bApp) return 1;

         const aVal = isOfferValid(a).valid && (type === 'item' ? (item?.totalQty >= (a.buyQty || a.minQty || 0)) : (totalWithTax >= (a.minBillAmount || 0)));
         const bVal = isOfferValid(b).valid && (type === 'item' ? (item?.totalQty >= (b.buyQty || b.minQty || 0)) : (totalWithTax >= (b.minBillAmount || 0)));

         if (aVal && !bVal) return -1;
         if (!aVal && bVal) return 1;

         return 0;
      });
   };

   const isApplied = (offerId) => appliedOffers.some(ao => ao.offer.id === offerId);

   return (
      <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
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
            className="relative bg-white w-full max-w-6xl h-[85vh] rounded-[3rem] shadow-2xl flex overflow-hidden border border-slate-100"
         >
            {/* Sidebar: Navigation */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
               <div className="p-6">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                        <Tag size={24} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Promotions</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Rewards</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex p-1.5 bg-slate-100 rounded-[1.2rem] mb-8">
                     <button
                        onClick={() => { setActiveTab('item'); setSelectedItem(null); }}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'item' ? 'bg-white text-rose-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Item Deals
                     </button>
                     <button
                        onClick={() => setActiveTab('bill')}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'bill' ? 'bg-white text-rose-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Bill Value
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-3 custom-scrollbar">
                  {activeTab === 'item' ? (
                     itemsWithOffers.length > 0 ? (
                        itemsWithOffers.map(item => {
                           const offersForItem = getValidOffers('item', item.id, item.totalQty);
                           const hasAppliedForThisItem = appliedOffers.some(ao => (ao.offer.targetItemId === item.id || ao.offer.buyItemId === item.id));

                           return (
                              <button
                                 key={item.id}
                                 onClick={() => setSelectedItem(item)}
                                 className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 relative group ${selectedItem?.id === item.id ? 'bg-rose-600 border-rose-700 shadow-xl text-white' : 'bg-white border-slate-50 hover:border-rose-100 text-slate-700'}`}
                              >
                                 <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-rose-50 text-rose-600'}`}>
                                    <ShoppingBag size={20} />
                                 </div>
                                 <div className="flex-1 overflow-hidden">
                                    <p className="font-black text-[11px] uppercase truncate">{item.name}</p>
                                    <p className={`text-[9px] font-bold ${selectedItem?.id === item.id ? 'text-rose-100' : 'text-slate-400'} uppercase mt-0.5`}>
                                       {offersForItem.length} Deals Available
                                    </p>
                                 </div>
                                 {hasAppliedForThisItem && (
                                    <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                       <Check size={12} strokeWidth={4} />
                                    </div>
                                 )}
                                 <ChevronRight size={16} className={`transition-transform ${selectedItem?.id === item.id ? 'translate-x-1' : 'opacity-20'}`} />
                              </button>
                           );
                        })
                     ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                           <ShoppingBag size={48} className="mb-4 text-slate-300" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add qualifying items<br />to unclock deals</p>
                        </div>
                     )
                  ) : (
                     <div className="space-y-4">
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 mb-2">
                           <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Cart Performance</p>
                           <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Bill Offers are evaluated based on your current total including tax.</p>
                        </div>
                        {/* Summary of current cart status in sidebar */}
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Net Cart Value</span>
                           <span className="text-xl font-black text-slate-700">{currencySymbol}{totalWithTax.toFixed(2)}</span>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Main Panel: Offer Selection */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">
               {activeTab === 'item' ? (
                  selectedItem ? (
                     <div className="flex-1 flex flex-col min-h-0 pt-10 px-12">
                        <div className="flex justify-between items-center mb-10">
                           <div>
                              <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-lg uppercase tracking-widest mb-3 inline-block">Item Specific Rewards</span>
                              <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Deals for {selectedItem.name}</h4>
                           </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                           {sortOffers(getValidOffers('item', selectedItem.id, selectedItem.totalQty), 'item', selectedItem).map(offer => (
                              <OfferCard
                                 key={offer.id}
                                 offer={offer}
                                 isApplied={isApplied(offer.id)}
                                 currencySymbol={currencySymbol}
                                 currentValue={selectedItem.totalQty}
                                 onApply={() => handleApply(offer, selectedItem)}
                                 onRemove={() => onRemoveOffer(offer.id)}
                                 meetsMin={selectedItem.totalQty >= (offer.buyQty || offer.minQty || 0)}
                                 minRequired={offer.buyQty || offer.minQty || 0}
                              />
                           ))}
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6">
                           <ShoppingBag size={48} />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Select an item</h4>
                        <p className="text-xs font-bold text-slate-300 uppercase mt-2 max-w-[240px] leading-relaxed">Choose an item from the left panel to see its available discounts and rewards</p>
                     </div>
                  )
               ) : (
                  <div className="flex-1 flex flex-col min-h-0 pt-10 px-12">
                     <div className="flex justify-between items-center mb-10">
                        <div>
                           <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg uppercase tracking-widest mb-3 inline-block">Bill Value Rewards</span>
                           <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Global Cart Discounts</h4>
                        </div>

                     </div>

                     <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar pb-10">
                        {sortOffers(billOffers, 'bill').map(offer => (
                           <OfferCard
                              key={offer.id}
                              offer={offer}
                              isApplied={isApplied(offer.id)}
                              currencySymbol={currencySymbol}
                              currentValue={totalWithTax}
                              onApply={() => handleApply(offer)}
                              onRemove={() => onRemoveOffer(offer.id)}
                              meetsMin={totalWithTax >= (offer.minBillAmount || 0)}
                              minRequired={offer.minBillAmount || 0}
                           />
                        ))}
                     </div>
                  </div>
               )}

               {/* Footer */}
               <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex gap-10">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Selected Offer Value</span>
                        <div className="flex items-baseline gap-1">
                           <span className="text-2xl font-black text-emerald-600">{currencySymbol}{appliedOffers.reduce((s, o) => s + o.discountAmount, 0).toFixed(2)}</span>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Saved</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button
                        onClick={onClose}
                        className="px-8 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all active:scale-95 border-2 border-transparent hover:border-rose-100"
                     >
                        Discard
                     </button>
                     <button
                        onClick={() => onRemoveOffer('ALL')}
                        className="px-8 h-14 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all active:scale-95 border-2 border-transparent hover:border-rose-100"
                     >
                        Reset All Offers
                     </button>
                     <button
                        onClick={onDone || onClose}
                        className="px-10 h-14 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
                     >
                        Done
                     </button>
                  </div>
               </div>
            </div>
         </motion.div>
      </div>
   );
};

const OfferCard = ({ offer, currencySymbol, onApply, onRemove, isApplied, meetsMin, minRequired, currentValue }) => {
   const validation = isOfferValid(offer);
   const isDisabled = !validation.valid || !meetsMin;

   const renderEffect = () => {
      switch (offer.type) {
         case 'FREE_ITEM':
         case 'BILL_AMOUNT_FREE_ITEM':
            const freeItem = itemsDb.find(i => i.id === offer.freeItemId);
            return (
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDisabled ? 'bg-slate-50 text-slate-300' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center`}>
                     <Gift size={20} />
                  </div>
                  <div>
                     <p className={`text-[9px] font-black uppercase tracking-widest ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>Free Reward</p>
                     <p className={`text-[13px] font-black uppercase ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}> {offer.freeQty}x {freeItem?.name} for Free</p>
                  </div>
               </div>
            );
         case 'ITEM_DISCOUNT_PERCENT':
         case 'BILL_AMOUNT_DISCOUNT_PERCENT':
            return (
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDisabled ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-blue-600'} rounded-xl flex items-center justify-center`}>
                     <Percent size={20} />
                  </div>
                  <div>
                     <p className={`text-[9px] font-black uppercase tracking-widest ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>Cash Discount</p>
                     <p className={`text-[13px] font-black uppercase ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>{offer.discountValue}% OFF {offer.maxDiscount ? `(Upto ${currencySymbol}${offer.maxDiscount})` : ''}</p>
                  </div>
               </div>
            );
         case 'BILL_AMOUNT_FLAT_DISCOUNT':
            return (
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDisabled ? 'bg-slate-50 text-slate-300' : 'bg-amber-50 text-amber-600'} rounded-xl flex items-center justify-center`}>
                     <Star size={20} />
                  </div>
                  <div>
                     <p className={`text-[9px] font-black uppercase tracking-widest ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>Flat Reduction</p>
                     <p className={`text-[13px] font-black uppercase ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>Flat {currencySymbol}{offer.discountValue} OFF</p>
                  </div>
               </div>
            );
         case 'BILL_AMOUNT_SPECIAL_PRICE':
            return (
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isDisabled ? 'bg-slate-50 text-slate-300' : 'bg-purple-50 text-purple-600'} rounded-xl flex items-center justify-center`}>
                     <CheckCircle2 size={20} />
                  </div>
                  <div>
                     <p className={`text-[9px] font-black uppercase tracking-widest ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>Combo Pricing</p>
                     <p className={`text-[13px] font-black uppercase ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>Only {currencySymbol}{offer.specialPriceValue} for Full Order</p>
                  </div>
               </div>
            );
         default:
            return null;
      }
   };

   return (
      <div className={`p-4 rounded-[1.8rem] border-2 transition-all relative overflow-hidden group ${isApplied ? 'bg-emerald-50/30 border-emerald-500 shadow-md' : (isDisabled ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-rose-200 hover:shadow-m hover:shadow-slate-100')}`}>

         <div className="flex justify-between items-start relative z-10">
            <div className="flex-1 pr-6">
               <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${isApplied ? 'bg-emerald-500 text-white' : (isDisabled ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>
                     {offer.type.replace(/_/g, ' ')}
                  </span>
                  {!validation.valid && (
                     <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                        <Clock size={12} /> {validation.reason}
                     </span>
                  )}
                  {validation.valid && !meetsMin && (
                     <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        <AlertCircle size={12} /> Needs {minRequired} {offer.type.startsWith('BILL_') ? 'Amount' : 'Qty'} (Current: {currentValue.toFixed(0)})
                     </span>
                  )}
               </div>

               <h5 className={`text-base font-black uppercase tracking-tight mb-4 ${isDisabled ? 'text-slate-400' : 'text-slate-800'}`}>{offer.name}</h5>
               {renderEffect()}

               <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-dashed border-slate-200">
                  <div className="flex items-center gap-2">
                     <Calendar size={12} className="text-slate-400" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valid until {offer.endDate}</span>
                  </div>
                  {(offer.startTime || offer.endTime) && (
                     <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{offer.startTime || '00:00'} - {offer.endTime || '23:59'}</span>
                     </div>
                  )}
               </div>
            </div>

            <div className="flex flex-col gap-2">
               {isApplied ? (
                  <button
                     onClick={onRemove}
                     className="h-11 px-6 bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                     <CheckCircle2 size={16} /> Applied
                  </button>
               ) : (
                  <button
                     disabled={isDisabled}
                     onClick={onApply}
                     className={`h-11 px-6 font-black rounded-xl active:scale-95 transition-all text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 ${isDisabled ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-m shadow-rose-200'}`}
                  >
                     {isDisabled ? 'Locked' : 'Apply'} <ArrowRight size={16} />
                  </button>
               )}
            </div>
         </div>

         {/* Background decoration */}
         {!isDisabled && !isApplied && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/30 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 pointer-events-none" />
         )}
      </div>
   );
};

export default OfferModal;
