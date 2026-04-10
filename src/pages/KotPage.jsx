import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
   Search, Minus, Plus, Info, Trash2, X, Check,
   ArrowLeft, ShoppingCart, User, Users, Clipboard, Armchair, ShoppingBag,
   Tag, Percent, Save, FileText, Ban, Bike, Package, Shuffle,
   ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, SearchCode,
   Layout as TableIcon, CreditCard, Banknote, Smartphone,
   BookOpen, Gift, Layers, Wallet, MapPin, Phone, Landmark, Ticket, AlertCircle, Trash
} from 'lucide-react';
import { groupsDb, organizersDb, itemsDb, authUsersDb, usersDb, deliveryAgentsDb, customersDb, ledgersDb, waitersDb, cookingInstructionsDb, initialConfig, offersDb } from '../data/mockDb';
import {
   getAllAddons, getAllProducts, saveAddon, saveProduct,
   getAllItemAddonLinks, getOrderByTable, generateKotNo, getSoldOutTracking, decrementTrackedItemQuants,
   saveToStore, ORDERS_STORE, ORDER_ITEMS_STORE, ORDER_ITEM_ADDONS_STORE, getOrderById, getOrderItems
} from '../data/idb';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, warning } from 'framer-motion';
import SettlementModal from '../components/modals/SettlementModal';
import OfferModal from '../components/modals/OfferModal';
import DiscountModal from '../components/modals/DiscountModal';
import PaxModal from '../components/modals/PaxModal';
import CustomerModal from '../components/modals/CustomerModal';
import NotesModal from '../components/modals/NotesModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import VoidItemModal from '../components/modals/VoidItemModal';
import AuthorizerModal from '../components/modals/AuthorizerModal';
import DeliveryAgentModal from '../components/modals/DeliveryAgentModal';
import PrintBillModal from '../components/modals/PrintBillModal';

const KotPage = () => {
   const {
      config, setConfig, cart, setCart, selectedTable, setSelectedTable,
      pax, setPax, selectedCustomer, setSelectedCustomer,
      orderNotes, setOrderNotes, notify, deliveryAgent, setDeliveryAgent,
      selectedWaiter, setSelectedWaiter, clearCurrentOrder
   } = useApp();
   const navigate = useNavigate();

   const [soldOutTracking, setSoldOutTracking] = useState([]);
   useEffect(() => {
      getSoldOutTracking().then(data => setSoldOutTracking(data || []));
   }, []);

   const [activeGroup, setActiveGroup] = useState('O1');
   const [searchTerm, setSearchTerm] = useState('');
   const [groupSearch, setGroupSearch] = useState('');
   const [showExtrasModal, setShowExtrasModal] = useState(null); // cartId
   const [showCancelModal, setShowCancelModal] = useState(null); // item
   const [showDiscountModal, setShowDiscountModal] = useState(false);
   const [showDeliveryModal, setShowDeliveryModal] = useState(false);
   const [showPaxModal, setShowPaxModal] = useState(false);
   const [showCustomerModal, setShowCustomerModal] = useState(false);
   const [showNotesModal, setShowNotesModal] = useState(false);
   const [showTableConfirm, setShowTableConfirm] = useState(false);
   const [showVoidConfirm, setShowVoidConfirm] = useState(false);
   const [isSavingKOT, setIsSavingKOT] = useState(false);
   const [showDiscountAuth, setShowDiscountAuth] = useState(false);
   const [pendingDiscount, setPendingDiscount] = useState(null);
   const [isDiscountAuth, setIsDiscountAuth] = useState(false);
   const [paxInput, setPaxInput] = useState('');
   const [orderDiscount, setOrderDiscount] = useState({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
   const [showSettlementModal, setShowSettlementModal] = useState(false);
   const [settlementType, setSettlementType] = useState('save'); // 'save' or 'settle'
   const [totalVisible, setTotalVisible] = useState(true);
   const [showBreakdown, setShowBreakdown] = useState(false);
   const [orderDiscountAuthUser, setOrderDiscountAuthUser] = useState(null);
   const [showOpenItemRate, setShowOpenItemRate] = useState(null); // item
   const [rateInput, setRateInput] = useState('');
   const [showOrderChoice, setShowOrderChoice] = useState(false);
   const [pendingChoiceAction, setPendingChoiceAction] = useState(null);


   // Offer Validation Helper
   const isOfferValid = (offer) => {
      const now = new Date();
      const today = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      if (offer.status !== 'active') return { valid: false };
      if (offer.startDate && new Date(offer.startDate) > now) return { valid: false };
      if (offer.endDate && new Date(offer.endDate + 'T23:59:59') < now) return { valid: false };
      if (offer.validDays && !offer.validDays.includes(today)) return { valid: false };
      if (offer.startTime && currentTime < offer.startTime) return { valid: false };
      if (offer.endTime && currentTime > offer.endTime) return { valid: false };

      return { valid: true };
   };

   // Auto-Apply Offers Effect
   useEffect(() => {
      const autoApply = () => {
         if (isBilled || cart.length === 0) return;

         const grossTotal = calculateTotal();
         const taxRate = config.taxRate || 0;
         const totalWithTax = grossTotal * (1 + taxRate / 100);

         // Filter for auto-apply eligible offers
         const autoOffers = offersDb.filter(o => o.isAuto && isOfferValid(o).valid);
         let newApplied = [...appliedOffers.filter(ao => !ao.offer.isAuto)]; // Keep manual ones

         for (const offer of autoOffers) {
            // Prevent double applying if already manually applied or another auto is better
            if (newApplied.some(ao => ao.offer.id === offer.id)) continue;

            let discountAmount = 0;
            let eligible = false;

            if (offer.type.startsWith('BILL_AMOUNT_')) {
               if (totalWithTax >= (offer.minBillAmount || 0)) {
                  eligible = true;
                  if (offer.type === 'BILL_AMOUNT_DISCOUNT_PERCENT') {
                     discountAmount = totalWithTax * (offer.discountValue / 100);
                     if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount);
                  } else if (offer.type === 'BILL_AMOUNT_FLAT_DISCOUNT') {
                     discountAmount = offer.discountValue;
                  } else if (offer.type === 'BILL_AMOUNT_SPECIAL_PRICE') {
                     discountAmount = Math.max(0, totalWithTax - offer.specialPriceValue);
                  }
               }
            } else {
               // Item wise
               const targetId = offer.targetItemId || offer.buyItemId;
               const targets = cart.filter(i => i.id === targetId);
               const totalQty = targets.reduce((s, i) => s + i.qty, 0);
               const minReq = offer.minQty || offer.buyQty || 0;

               if (totalQty >= minReq) {
                  eligible = true;
                  if (offer.type === 'ITEM_DISCOUNT_PERCENT') {
                     const itemTotal = targets.reduce((sum, i) => sum + (i.price * i.qty), 0);
                     discountAmount = itemTotal * (offer.discountValue / 100);
                  } else if (offer.type === 'FREE_ITEM') {
                     const freeItem = itemsDb.find(i => i.id === offer.freeItemId);
                     discountAmount = freeItem ? (freeItem.price * offer.freeQty) : 0;
                  }
               }
            }

            if (eligible && discountAmount > 0) {
               // Mutual Exclusivity Logic: For Bill offers, usually only one applies
               if (offer.type.startsWith('BILL_AMOUNT_')) {
                  const existingBillOffer = newApplied.find(ao => ao.offer.type.startsWith('BILL_AMOUNT_'));
                  if (existingBillOffer) {
                     if (discountAmount > existingBillOffer.discountAmount) {
                        newApplied = newApplied.filter(ao => ao !== existingBillOffer);
                        newApplied.push({ offer, discountAmount });
                     }
                  } else {
                     newApplied.push({ offer, discountAmount });
                  }
               } else {
                  newApplied.push({ offer, discountAmount });
               }
            }
         }

         // Only update if changed to avoid loops
         if (JSON.stringify(newApplied) !== JSON.stringify(appliedOffers)) {
            setAppliedOffers(newApplied);
            notify(`Offer Applied : ${newApplied[0].offer?.name}`, "success");
         }
      };

      autoApply();
   }, [cart, config.taxRate]);


   // Sync customer details to active order when selectedCustomer changes
   useEffect(() => {
      const syncCustomer = async () => {
         if (selectedCustomer && config.defaultKotType === 'DI' && selectedTable?.id) {
            const activeOrder = await getOrderByTable(selectedTable.id);
            if (activeOrder && activeOrder.customerId !== selectedCustomer.id) {
               activeOrder.customerId = selectedCustomer.id;
               await saveToStore(ORDERS_STORE, activeOrder);
            }
         }
      };
      syncCustomer();
   }, [selectedCustomer]);
   const [showOfferModal, setShowOfferModal] = useState(false);
   const [showOfferAuth, setShowOfferAuth] = useState(false);
   const [appliedOffers, setAppliedOffers] = useState([]); // Array of { offer, discountAmount }
   const [pendingAction, setPendingAction] = useState(null); // 'KOT', 'SAVE_BILL', 'SETTLE_BILL'
   const [showPrintConfirm, setShowPrintConfirm] = useState(false);
   const [showVariantModal, setShowVariantModal] = useState(null); // Deprecated
   const [showProductModal, setShowProductModal] = useState(null); // { product, cartItem? }
   const [showAddonModal, setShowAddonModal] = useState(null); // { cartId, selectedAddons }
   const groupListRef = React.useRef(null);
   const [dbProducts, setDbProducts] = useState([]);
   const [dbAddons, setDbAddons] = useState([]);
   const [dbItemAddonLinks, setDbItemAddonLinks] = useState([]);

   // Modal Helper States
   const [modalInstructions, setModalInstructions] = useState([]);
   const [modalParcel, setModalParcel] = useState(false);
   const [instructionSearch, setInstructionSearch] = useState('');

   // Group sorting for movement
   const [groups, setGroups] = useState([
      ...organizersDb.map(o => ({ ...o, type: 'organizer' })),
      ...groupsDb.map(g => ({ ...g, type: 'group' }))
   ]);

   useEffect(() => {
      loadIdbData();
   }, []);

   const loadIdbData = async () => {
      try {
         const products = await getAllProducts();
         const addons = await getAllAddons();
         const links = await getAllItemAddonLinks();
         setDbProducts(products);
         setDbAddons(addons);
         setDbItemAddonLinks(links);

         // Update groups with virtual categories if data exists
         const virtualGroups = [];

         const choiceItems = products.filter(p => p.type === 'CHOICE_ITEM' && p.status === 'Active');
         if (choiceItems.length > 0) {
            virtualGroups.push({ id: 'VIRTUAL_CHOICE', name: 'Choice Items', type: 'virtual' });
         }

         const comboItems = products.filter(p => p.type === 'COMBO_ITEM' && p.status === 'Active');
         if (comboItems.length > 0) {
            virtualGroups.push({ id: 'VIRTUAL_COMBO', name: 'Combos', type: 'virtual' });
         }

         if (virtualGroups.length > 0) {
            setGroups(prev => {
               const baseGroups = prev.filter(g => g.type !== 'virtual');
               return [...baseGroups, ...virtualGroups];
            });
         }
      } catch (err) {
         console.error("Failed to load IDB data", err);
      }
   };

   useEffect(() => {
      setPaxInput(pax.toString());
   }, [pax, showPaxModal]);

   // Redirect to table selection if Dine-In and no table is selected
   useEffect(() => {
      if (config.defaultKotType === 'DI' && !selectedTable) {
         navigate('/tables');
      }
   }, [config.defaultKotType, selectedTable, navigate]);

   // Sync modal states when opening showExtrasModal
   useEffect(() => {
      if (showExtrasModal) {
         const item = cart.find(c => c.cartId === showExtrasModal);
         if (item) {
            setModalParcel(item.isParcel || false);
            setModalInstructions(item.notes ? (Array.isArray(item.notes) ? item.notes : [item.notes]) : []);
            setInstructionSearch('');
         }
      }
   }, [showExtrasModal, cart]);

   const filteredItems = itemsDb.filter(i => {
      const currentGroup = groups.find(g => g.id === activeGroup);
      if (!currentGroup) return false;

      if (currentGroup.type === 'virtual') {
         if (activeGroup === 'VIRTUAL_CHOICE') {
            return false;
         }
         if (activeGroup === 'VIRTUAL_COMBO') {
            return false;
         }
      }

      const itemInGroup = currentGroup.type === 'organizer'
         ? currentGroup.items.includes(i.id) // Check the specific collection array
         : i.groupId === activeGroup;       // Check the category ID on the item

      return itemInGroup;
   });

   // Separate list for virtual items
   const virtualDisplayItems = useMemo(() => {
      if (activeGroup === 'VIRTUAL_CHOICE') return dbProducts.filter(p => p.type === 'CHOICE_ITEM' && p.status === 'Active');
      if (activeGroup === 'VIRTUAL_COMBO') return dbProducts.filter(p => p.type === 'COMBO_ITEM' && p.status === 'Active');
      return [];
   }, [activeGroup, dbProducts]);

   const allDisplayItems = useMemo(() => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!config.openSearch && searchLower !== '') {
         // Global search: Merge itemsDb and dbProducts
         const matchingRegular = itemsDb.filter(i =>
            i.name.toLowerCase().includes(searchLower) || i.id.toLowerCase().includes(searchLower)
         );
         const matchingProducts = dbProducts.filter(p =>
            (p.displayName.toLowerCase().includes(searchLower) || p.id?.toString().toLowerCase().includes(searchLower)) &&
            p.status === 'Active'
         );
         return [...matchingRegular, ...matchingProducts];
      }

      const activeG = groups.find(g => g.id === activeGroup);
      if (activeG?.type === 'virtual') return virtualDisplayItems;
      return filteredItems;
   }, [searchTerm, activeGroup, filteredItems, virtualDisplayItems, dbProducts, config.openSearch]);

   const suggestedItems = config.openSearch && searchTerm.trim() !== ''
      ? [
         ...itemsDb.filter(i =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.arName && i.arName.includes(searchTerm))
         ),
         ...dbProducts.filter(p =>
            (p.type === 'CHOICE_ITEM' || p.type === 'COMBO_ITEM') &&
            p.status === 'Active' &&
            p.displayName.toLowerCase().includes(searchTerm.toLowerCase())
         )
      ].slice(0, 12)
      : [];

   // Focus active group in sidebar
   useEffect(() => {
      if (activeGroup && groupListRef.current) {
         const activeBtn = document.getElementById(`group-btn-${activeGroup}`);
         if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
         }
      }
   }, [activeGroup]);

   const filteredGroups = groups.filter(g =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase())
   );

   const addToCart = (item) => {
      if (isBilled) return;

      const tracked = soldOutTracking.find(t => t.id === item.id);
      if (tracked && tracked.isSoldOut) {
         return notify(`${item.displayName || item.name} is currently Sold Out!`, 'error');
      }

      const cartCount = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.qty, 0);
      if (tracked && !tracked.isSoldOut && tracked.qty > 0) {
         if (cartCount + 1 > tracked.qty) {
            return notify(`Only ${tracked.qty} remaining for ${item.displayName || item.name}!`, 'error');
         }
      }

      if (item.type === 'CHOICE_ITEM' || item.type === 'COMBO_ITEM') {
         setShowProductModal({ product: item });
         return;
      }

      if (item.openItem) {
         setShowOpenItemRate(item);
         setRateInput(item.price?.toString() || '');
         return;
      }

      const existing = cart.find(c => c.id === item.id && !c.isSaved && !c.isParcel && (!c.notes || c.notes.length === 0));
      if (existing) {
         setCart(cart.map(c => c.cartId === existing.cartId ? { ...c, qty: c.qty + 1 } : c));
      } else {
         const cartId = Math.random();
         setCart([...cart, {
            ...item,
            cartId,
            qty: 1,
            isSaved: false,
            isParcel: false,
            notes: [],
            sessionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         }]);
      }
      setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
      setAppliedOffers([]);
   };

   const handleOpenItemConfirm = () => {
      if (!showOpenItemRate || !rateInput) return;
      const rate = parseFloat(rateInput);
      if (isNaN(rate) || rate <= 0) return notify('Please enter a valid rate', 'error');

      const itemWithRate = { ...showOpenItemRate, price: rate };

      if (showOpenItemRate.cartId) {
         // Updating item already in cart
         setCart(prev => prev.map(c => c.cartId === showOpenItemRate.cartId ? { ...c, price: rate } : c));
         notify(`${itemWithRate.name} rate updated to ${config.currencySymbol}${rate}`, 'success');
      } else {
         // Adding new item
         const cartId = Math.random();
         setCart([...cart, {
            ...itemWithRate,
            cartId,
            qty: 1,
            isSaved: false,
            isParcel: false,
            notes: [],
            sessionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         }]);
         notify(`${itemWithRate.name} added with rate ${config.currencySymbol}${rate}`, 'success');
      }

      setShowOpenItemRate(null);
      setRateInput('');
   };

   const handleProductConfirm = (product, selectedVariant, selectedAddons) => {
      let basePrice = 0;

      if (product.type === 'CHOICE_ITEM') {
         basePrice = parseFloat(selectedVariant.price) || 0;
      } else if (product.type === 'COMBO_ITEM') {
         basePrice = (product.variants || []).reduce((sum, v) => sum + (parseFloat(v.price) * (v.qty || 1)), 0);
      }

      if (showProductModal.cartItem) {
         // Updating existing item
         setCart(prev => prev.map(item => {
            if (item.cartId === showProductModal.cartItem.cartId) {
               return {
                  ...item,
                  variantName: selectedVariant?.displayName,
                  price: basePrice,
                  addons: selectedAddons
               };
            }
            return item;
         }));
      } else {
         // Adding new item
         const cartId = Math.random();
         const newCartItem = {
            id: product.id,
            cartId,
            name: product.displayName,
            variantName: selectedVariant?.displayName,
            price: basePrice,
            qty: 1,
            isParcel: false,
            notes: [],
            addons: selectedAddons,
            isSaved: false,
            type: product.type === 'CHOICE_ITEM' ? 'CHOICE' : 'COMBO',
            contents: product.type === 'COMBO_ITEM' ? product.variants : []
         };
         setCart([...cart, newCartItem]);
      }

      setShowProductModal(null);
      notify(`${product.displayName} ${showProductModal.cartItem ? 'updated' : 'added to cart'}`, 'success');
   };

   const handleAddon = (cartId) => {
      const item = cart.find(c => c.cartId === cartId);
      if (!item) return;

      // If it's a Choice or Combo product, open the specialized modal for editing
      if (item.type === 'CHOICE' || item.type === 'COMBO') {
         const product = dbProducts.find(p => p.id === item.id);
         if (product) {
            setShowProductModal({ product, cartItem: item });
            return;
         }
      }

      // Otherwise open the simple addon modal with filtered list
      const linkedRecord = dbItemAddonLinks.find(l => l.itemId === item.id && l.status !== 'Inactive');
      const availableAddons = linkedRecord ? (linkedRecord.addons || []) : [];
      setShowAddonModal({ cartId, availableAddons });
   };

   const handleAddonToggle = (cartId, addon) => {
      setCart(prev => prev.map(c => {
         if (c.cartId === cartId) {
            const addons = c.addons || [];
            const exists = addons.find(a => a.id === addon.id);
            if (exists) {
               return { ...c, addons: addons.filter(a => a.id !== addon.id) };
            } else {
               return { ...c, addons: [...addons, addon] };
            }
         }
         return c;
      }));
   };

   const updateQty = (cartId, delta) => {
      if (isBilled) {
         return notify('Bill already saved. Cannot modify quantities.', 'warning');
      }

      if (delta > 0) {
         const cartItem = cart.find(c => c.cartId === cartId);
         if (cartItem) {
            const tracked = soldOutTracking.find(t => t.id === cartItem.id);
            const cartCount = cart.filter(c => c.id === cartItem.id).reduce((sum, c) => sum + c.qty, 0);
            if (tracked && !tracked.isSoldOut && tracked.qty > 0) {
               if (cartCount + 1 > tracked.qty) {
                  return notify(`Only ${tracked.qty} remaining for ${cartItem.name}!`, 'error');
               }
            }
         }
      }
      setCart(cart.map(c => {
         if (c.cartId === cartId) {
            const newQty = Math.max(1, c.qty + delta);
            return { ...c, qty: newQty };
         }
         return c;
      }));
      // Reset discount on qty update
      setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
      setAppliedOffers([]); // Reset offers on qty update
   };

   const handleCancelItem = (item) => {
      if (isBilled) {
         return notify('Bill already saved. Cannot remove items.', 'warning');
      }
      if (!item.isSaved) {
         setCart(cart.filter(c => c.cartId !== item.cartId));
      } else {
         setShowCancelModal(item);
      }
      // Reset discount on qty update
      setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
      setAppliedOffers([]); // Reset offers on qty update
   };

   const handleApplyOffer = (offer, targetItem = null) => {
      let discountAmount = 0;
      const grossTotal = calculateTotal();
      const taxRate = config.taxRate || 0;
      const totalWithTax = grossTotal * (1 + taxRate / 100);

      const validation = isOfferValid(offer);
      if (!validation.valid) return notify('Offer is not currently valid', 'warning');

      if (offer.type.startsWith('BILL_AMOUNT_')) {
         if (totalWithTax < (offer.minBillAmount || 0)) {
            return notify(`Min bill of ${config.currencySymbol}${offer.minBillAmount} required`, 'warning');
         }
         if (offer.type === 'BILL_AMOUNT_DISCOUNT_PERCENT') {
            discountAmount = totalWithTax * (offer.discountValue / 100);
            if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount);
         } else if (offer.type === 'BILL_AMOUNT_FLAT_DISCOUNT') {
            discountAmount = offer.discountValue;
         } else if (offer.type === 'BILL_AMOUNT_SPECIAL_PRICE') {
            discountAmount = Math.max(0, totalWithTax - offer.specialPriceValue);
         } else if (offer.type === 'BILL_AMOUNT_FREE_ITEM') {
            const freeItem = itemsDb.find(i => i.id === offer.freeItemId);
            discountAmount = freeItem ? (freeItem.price * (1 + taxRate / 100) * offer.freeQty) : 0;
         }

         const newOffers = appliedOffers.filter(o => !o.offer.type.startsWith('BILL_AMOUNT_'));
         newOffers.push({ offer, discountAmount });
         setAppliedOffers(newOffers);
         notify(`${offer.name} Applied`, 'success');
      } else {
         const targetId = targetItem ? targetItem.id : offer.targetItemId;
         const targets = cart.filter(i => i.id === targetId);
         const totalQty = targets.reduce((s, i) => s + i.qty, 0);
         const minReq = offer.minQty || offer.buyQty || 0;

         if (totalQty < minReq) {
            return notify(`Min qty of ${minReq} required for this item`, 'warning');
         }

         if (offer.type === 'ITEM_DISCOUNT_PERCENT') {
            const itemTotal = targets.reduce((sum, i) => sum + (i.price * i.qty), 0);
            discountAmount = itemTotal * (offer.discountValue / 100);
         } else if (offer.type === 'FREE_ITEM') {
            const freeItem = itemsDb.find(i => i.id === offer.freeItemId);
            discountAmount = freeItem ? (freeItem.price * offer.freeQty) : 0;
         }

         if (discountAmount > 0) {
            const filtered = appliedOffers.filter(o =>
               !(o.offer.targetItemId === targetId || o.offer.buyItemId === targetId)
            );
            setAppliedOffers([...filtered, { offer, discountAmount }]);
            notify(`${offer.name} Applied`, 'success');
         }
      }
      setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
   };

   const calculateOffersDiscount = () => {
      return appliedOffers.reduce((sum, o) => sum + o.discountAmount, 0);
   };

   const calculateTotal = () => {
      return cart.reduce((acc, item) => {
         let itemTotal = item.price * item.qty;
         if (item.addons) {
            const addonsTotal = item.addons.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
            itemTotal += addonsTotal * item.qty;
         }
         return acc + itemTotal;
      }, 0);
   };

   const handleManualPriceChange = (cartId, newPrice) => {
      setCart(cart.map(c => c.cartId === cartId ? { ...c, price: parseFloat(newPrice) || 0 } : c));
   };

   const handleTableChangeRequest = () => {
      if (cart.length > 0) {
         setShowTableConfirm(true);
      } else {
         navigate('/tables');
      }
   };

   // Group movement logic
   const moveGroup = (direction) => {
      if (groupListRef.current) {
         const scrollAmount = 200;
         groupListRef.current.scrollBy({
            top: direction === 'up' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
         });
      }
   };

   const hasUnsaved = cart.some(i => !i.isSaved);
   const hasSaved = cart.some(i => i.isSaved);
   const isCartEmpty = cart.length === 0;
   const isTakeAway = config.defaultKotType === 'TA';
   const isDelivery = config.defaultKotType === 'DE' || config.defaultKotType === 'HD';
   const isBilled = selectedTable?.status?.toUpperCase() === 'BILLED' || selectedTable?.status?.toUpperCase() === 'SAVED';

   const handleCancelOrder = () => {
      if (!hasSaved) {
         setCart([]);
         setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
         setAppliedOffers([]); // Reset offers on cancel
         notify('Order discarded', 'info');
      } else {
         setShowVoidConfirm(true);
      }
   };

   const handleOfferModalDone = () => {
      setShowOfferModal(false);
      const action = pendingAction;
      setPendingAction(null);

      if (action === 'KOT') {
         handleSaveKOT(true);
      } else if (action === 'SAVE_BILL' || action === 'SETTLE_BILL') {
         setSettlementType(action === 'SAVE_BILL' ? 'save' : 'settle');
         setShowSettlementModal(true);
      }
   };

   const checkUnappliedOffers = () => {
      const now = new Date();
      const today = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const taxRate = config.taxRate || 0;
      const totalWithTax = calculateTotal() * (1 + taxRate / 100);

      return offersDb.some(offer => {
         if (offer.status !== 'active') return false;
         if (offer.startDate && new Date(offer.startDate) > now) return false;
         if (offer.endDate && new Date(offer.endDate + 'T23:59:59') < now) return false;
         if (offer.validDays && !offer.validDays.includes(today)) return false;
         if (offer.startTime && currentTime < offer.startTime) return false;
         if (offer.endTime && currentTime > offer.endTime) return false;

         // Check if already applied
         if (appliedOffers.some(ao => ao.offer.id === offer.id)) return false;

         // Check eligibility
         if (offer.type.startsWith('BILL_AMOUNT_')) {
            return totalWithTax >= (offer.minBillAmount || 0);
         } else {
            const targetId = offer.targetItemId || offer.buyItemId;
            const totalQtyOfItem = cart.filter(i => i.id === targetId).reduce((s, i) => s + i.qty, 0);
            return totalQtyOfItem >= (offer.buyQty || offer.minQty || 0);
         }
      });
   };

   const initiateSettlement = (type, forced = false) => {
      if (cart.length === 0) return;

      if (!forced && isTakeAway && config.enablePostOrderType) {
         setPendingChoiceAction(type);
         setShowOrderChoice(true);
         return;
      }

      // If forced=true (from choice popup), bypass table selection and delivery agent modals
      if (!forced) {
         if (config.defaultKotType === 'DI' && !selectedTable) {
            notify('Please select a table first', 'warning');
            return;
         }

         if (type === 'save' && isDelivery) {
            setPendingAction('SAVE_BILL');
            setShowDeliveryModal(true);
            return;
         }
      }

      if (!isBilled && checkUnappliedOffers()) {
         setPendingAction(type === 'save' ? 'SAVE_BILL' : 'SETTLE_BILL');
         setShowOfferModal(true);
         notify('New offers available for this order!', 'info');
         return;
      }
      setSettlementType(type);
      setShowSettlementModal(true);
   };

   const handleSaveKOT = async (skipCheck = false) => {
      if (cart.length === 0) return;

      if (config.defaultKotType === 'DI' && !selectedTable) {
         notify('Please select a table first', 'warning');
         return;
      }

      if (config.waiterMandatory && !selectedWaiter) {
         return notify('Please select a waiter first', 'error');
      }

      if (isDelivery && !selectedCustomer) {
         setPendingAction('KOT');
         setShowCustomerModal(true);
         notify('Customer details are mandatory for delivery', 'warning');
         return;
      }

      if (!skipCheck && checkUnappliedOffers()) {
         setPendingAction('KOT');
         setShowOfferModal(true);
         notify('Check available offers before saving!', 'info');
         return;
      }

      setIsSavingKOT(true);

      try {
         const orderType = config.defaultKotType;
         let activeOrder = null;

         if (selectedTable?.orderId) {
            activeOrder = await getOrderById(selectedTable.orderId);
         }

         if (!activeOrder && orderType === 'DI' && selectedTable) {
            activeOrder = await getOrderByTable(selectedTable.id);
         }
         // TA and DE do not map to tables, we now use active orders ID passed from context if editing DE/TA.

         if (!activeOrder) {
            activeOrder = {
               id: "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
               type: orderType,
               tableId: orderType === 'DI' ? selectedTable.id : null,
               parentTableId: orderType === 'DI' ? (selectedTable.id.toString().split('-')[0]) : null,
               waiterId: selectedWaiter?.id || null,
               customerId: selectedCustomer?.id || null,
               deliveryAgentId: deliveryAgent?.id || null,
               pax: parseInt(pax) || 1,
               status: 'running',
               subTotal: 0,
               discount: 0,
               taxes: 0,
               grandTotal: 0,
               offerDetails: null, // Bill wise offer applied at bill-save phase
               orderDescription: orderNotes || '',
               invoiceNo: null,
               latestKotNo: 0,
               createTime: new Date().toISOString(),
               billTime: null,
               settleTime: null,
               settleUser: null,
               settleLedger: null,
               payType: null
            };
         } else {
            // Update active order metadata if changed during edit
            activeOrder.waiterId = selectedWaiter?.id || activeOrder.waiterId;
            activeOrder.customerId = selectedCustomer?.id || activeOrder.customerId;
            activeOrder.deliveryAgentId = deliveryAgent?.id || activeOrder.deliveryAgentId;
            activeOrder.orderDescription = orderNotes || activeOrder.orderDescription;
            activeOrder.pax = parseInt(pax) || activeOrder.pax;
         }

         // Ensure order exists before generating KOT so latestKotNo is available
         await saveToStore(ORDERS_STORE, activeOrder);

         const nextKotNo = await generateKotNo(activeOrder.type);
         activeOrder.latestKotNo = nextKotNo;
         let subTotalCounter = 0;

         // Identify explicitly unsaved cart items to push to IDB 
         // Active items that were already rendered as "isSaved" are already in IDB!
         const newCartItems = cart.filter(c => !c.isSaved);

         for (const item of newCartItems) {
            const orderItemId = "ITM_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

            // Mapping to our explicit boolean combos matrix
            const isChoice = item.type === 'CHOICE';
            const isCombo = item.type === 'COMBO';

            const dbOrderItem = {
               id: orderItemId,
               orderId: activeOrder.id,
               kotNo: nextKotNo,
               itemId: item.id, // Master ID (Actual Item, Choice Master, Combo Master)
               isChoice: isChoice,
               variantId: isChoice ? item.variantName : null, // storing variant name or id
               isCombo: isCombo,
               comboId: isCombo ? item.id : null,
               qty: item.qty,
               price: item.price,
               itemTax: 0, // calculate if itemsDb has tax % mapping later
               isParcel: item.isParcel || false,
               cookingInstructions: item.modifiers || [],
               offerDetails: null, // applied offer logic per item
               status: 'active',
               cancelReason: null,
               cancelTime: null,
               addedTime: new Date().toISOString()
            };

            await saveToStore(ORDER_ITEMS_STORE, dbOrderItem);

            // Process Addons
            if (item.addons && item.addons.length > 0) {
               for (const addon of item.addons) {
                  const addonRecord = {
                     id: "ADDON_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
                     orderItemId: orderItemId,
                     addonId: addon.id,
                     price: parseFloat(addon.price) || 0,
                     qty: item.qty // addons typically mirror parent qty
                  };
                  await saveToStore(ORDER_ITEM_ADDONS_STORE, addonRecord);
               }
            }

            // Compute rough subTotal calculation for immediate visual sync
            let itemTotal = parseFloat(item.price) * item.qty;
            if (item.addons) {
               itemTotal += item.addons.reduce((s, a) => s + ((parseFloat(a.price) || 0) * item.qty), 0);
            }
            subTotalCounter += itemTotal;
         }

         // Update order total metrics
         activeOrder.subTotal = (activeOrder.subTotal || 0) + subTotalCounter;
         // Temporary default tax/discount logic, will be overridden heavily by billing save
         activeOrder.grandTotal = activeOrder.subTotal;
         await saveToStore(ORDERS_STORE, activeOrder);

         notify('KOT Generated & Sent to Kitchen', 'success');

         setTimeout(() => {
            clearCurrentOrder();
            setIsSavingKOT(false);
            navigate('/tables');
         }, 500);

      } catch (err) {
         console.error('Failed to save KOT:', err);
         notify('Failed to save order to database', 'error');
         setIsSavingKOT(false);
      }
   };

   const handleDirectSettle = () => {
      if (cart.length === 0) return;
      if (config.waiterMandatory && !selectedWaiter) {
         return notify('Please select a waiter first', 'error');
      }
      if (hasUnsaved) {
         setCart(cart.map(c => ({
            ...c,
            isSaved: true,
            sessionTime: c.sessionTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         })));
      }
      if (checkUnappliedOffers()) {
         setPendingAction('SETTLE_BILL');
         setShowOfferModal(true);
         notify('Check available offers before settling!', 'info');
         return;
      }
      initiateSettlement('settle');
   };

   return (
      <div className="flex-1 flex overflow-hidden bg-[#fdf2f2] p-1.5 h-full relative">
         <div className="flex-1 flex gap-1.5 overflow-hidden">

            {/* PART 1: CART (650px) */}
            <div className="w-[650px] bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xl">
               {/* Cart Header Panel */}
               {/* Cart Header Panel / Toolbar */}
               <div className={`grid ${config.defaultKotType === 'DI' ? 'grid-cols-4' : 'grid-cols-2'} border-b border-slate-100 overflow-hidden shrink-0`}>
                  {config.defaultKotType === 'DI' && (
                     <>
                        <button
                           onClick={handleTableChangeRequest}
                           disabled={selectedTable?.status === 'running'}
                           className="h-16 flex flex-col items-center justify-center border-r border-slate-100 hover:bg-slate-50 transition-all group disabled:opacity-40"
                        >
                           <TableIcon size={18} className="text-blue-600 mb-1" />
                           <span className="text-[9px] font-black uppercase text-slate-500">{selectedTable?.id || 'NO TABLE'}</span>
                        </button>
                        <button
                           onClick={() => setShowPaxModal(true)}
                           disabled={selectedTable?.status === 'running'}
                           className="h-16 flex flex-col items-center justify-center border-r border-slate-100 hover:bg-slate-50 transition-all disabled:opacity-40"
                        >
                           <Users size={18} className="text-blue-600 mb-1" />
                           <span className="text-[9px] font-black uppercase text-slate-500">PAX: {pax}</span>
                        </button>
                     </>
                  )}
                  <button
                     onClick={() => setShowCustomerModal(true)}
                     className="h-16 flex flex-col items-center justify-center border-r border-slate-100 hover:bg-slate-50 transition-all"
                  >
                     <User size={18} className="text-blue-600 mb-1" />
                     <span className="text-[9px] font-black uppercase text-slate-500 overflow-hidden whitespace-nowrap px-1">
                        {selectedCustomer?.name || 'CUSTOMER'}
                     </span>
                  </button>
                  <button
                     onClick={() => setShowNotesModal(true)}
                     className="h-16 flex flex-col items-center justify-center hover:bg-slate-50 transition-all"
                  >
                     <Clipboard size={18} className="text-blue-600 mb-1" />
                     <span className="text-[9px] font-black uppercase text-slate-500">
                        NOTES
                     </span>
                  </button>
               </div>

               {/* Cart Listing */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-[#f8fafc]">
                  <div className="space-y-1">
                     {/* Table Header */}
                     <div className="flex px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 mb-2">
                        <span className="flex-1">Items</span>
                        <span className="w-32 text-start">Qty</span>
                        <span className="w-32 text-right">Price / Total</span>
                     </div>

                     {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                           <ShoppingCart size={80} strokeWidth={1} className="text-slate-400 mb-4" />
                           <p className="font-black uppercase tracking-[0.3em] text-sm">Cart is Empty</p>
                        </div>
                     ) : (
                        <>
                           {/* Grouped Saved Items */}
                           {Object.entries(
                              cart.filter(c => c.isSaved).reduce((acc, item) => {
                                 const key = item.sessionTime || 'Previous';
                                 if (!acc[key]) acc[key] = [];
                                 acc[key].push(item);
                                 return acc;
                              }, {})
                           ).map(([time, items]) => (
                              <div key={time} className="mb-4">
                                 <div className="flex items-center gap-2 mb-2 px-1">
                                    <span className="h-[1px] flex-1 bg-amber-200" />
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                       KOT: {items[0]?.kotNo || '1'} - Time : {time}
                                    </span>
                                    <span className="h-[1px] flex-1 bg-amber-200" />
                                 </div>
                                 {items.map(item => {
                                    const hasAddonMapping = (item.type === 'CHOICE' || item.type === 'COMBO') || dbItemAddonLinks.some(l => l.itemId === item.id && l.status !== 'Inactive');
                                    return (
                                       <CartRow
                                          key={item.cartId}
                                          item={item}
                                          isLocked={isBilled}
                                          onQtyChange={updateQty}
                                          onCancel={handleCancelItem}
                                          onExtras={() => setShowExtrasModal(item.cartId)}
                                          onPriceChange={handleManualPriceChange}
                                          onRateEdit={(item) => {
                                             setShowOpenItemRate(item);
                                             setRateInput(item.price.toString());
                                          }}
                                          onAddon={handleAddon}
                                          showAddonButton={hasAddonMapping}
                                       />
                                    );
                                 })}
                              </div>
                           ))}

                           {/* New Items Group */}
                           {cart.filter(c => !c.isSaved).length > 0 && (
                              <div>
                                 <div className="flex items-center gap-2 mb-2 px-1">
                                    <span className="h-[1px] flex-1 bg-emerald-200" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">New Session</span>
                                    <span className="h-[1px] flex-1 bg-emerald-200" />
                                 </div>
                                 {cart.filter(c => !c.isSaved).map(item => {
                                    const hasAddonMapping = (item.type === 'CHOICE' || item.type === 'COMBO') || dbItemAddonLinks.some(l => l.itemId === item.id && l.status !== 'Inactive');
                                    return (
                                       <CartRow
                                          key={item.cartId}
                                          item={item}
                                          isLocked={isBilled}
                                          onQtyChange={updateQty}
                                          onCancel={handleCancelItem}
                                          onExtras={() => setShowExtrasModal(item.cartId)}
                                          onPriceChange={handleManualPriceChange}
                                          onRateEdit={(item) => {
                                             setShowOpenItemRate(item);
                                             setRateInput(item.price.toString());
                                          }}
                                          onAddon={handleAddon}
                                          showAddonButton={hasAddonMapping}
                                       />
                                    );
                                 })}
                              </div>
                           )}
                        </>
                     )}
                  </div>
               </div>

               {/* Cart Footer */}
               <div className="p-4 bg-white border-t border-slate-200 shadow-2xl relative">
                  {/* Breakdown Popup */}
                  <AnimatePresence>
                     {showBreakdown && (
                        <>
                           <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setShowBreakdown(false)}
                              className="fixed inset-0 z-[550]"
                           />
                           <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-[calc(100%+8px)] right-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[600]"
                           >
                              <div className="space-y-4">
                                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>Order Summary</span>
                                    <button onClick={() => setShowBreakdown(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={16} /></button>
                                 </div>
                                 <div className="h-[1px] bg-slate-50" />
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-slate-500">Gross Total</span>
                                       <span className="text-xs font-black text-slate-800">{config.currencySymbol}{calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-slate-500">Service Tax ({config.taxRate}%)</span>
                                       <span className="text-xs font-black text-slate-800">+{config.currencySymbol}{(calculateTotal() * (config.taxRate / 100)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-slate-500">Discount</span>
                                       <span className="text-xs font-black text-rose-500">-{config.currencySymbol}{orderDiscount.amount.toFixed(2)}</span>
                                    </div>
                                    {appliedOffers.length > 0 && appliedOffers.map((ao, idx) => (
                                       <div key={idx} className="flex justify-between items-center">
                                          <div className="flex flex-col">
                                             <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">Offer: {ao.offer.name}</span>
                                             <span className="text-[8px] font-bold text-slate-400 uppercase">Applied Benefit</span>
                                          </div>
                                          <span className="text-xs font-black text-rose-500">-{config.currencySymbol}{ao.discountAmount.toFixed(2)}</span>
                                       </div>
                                    ))}
                                    <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-slate-500">Advance</span>
                                       <span className="text-xs font-black text-emerald-500">-{config.currencySymbol}0.00</span>
                                    </div>
                                 </div>
                                 <div className="pt-3 border-t border-slate-100">
                                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-2xl border border-blue-100/30">
                                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Net Payable</span>
                                       <span className="text-lg font-black text-blue-700">{config.currencySymbol}{((calculateTotal() * (1 + config.taxRate / 100)) - orderDiscount.amount - calculateOffersDiscount()).toFixed(2)}</span>
                                    </div>
                                 </div>
                              </div>
                              {/* Arrow pointer */}
                              <div className="absolute top-full right-8 w-4 h-4 bg-white border-r border-b border-slate-100 transform rotate-45 -translate-y-2.5 shadow-sm" />
                           </motion.div>
                        </>
                     )}
                  </AnimatePresence>

                  <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        {/* Offer Button */}
                        <button
                           onClick={() => {
                              if (isBilled) {
                                 setShowOfferAuth(true);
                              } else {
                                 setShowOfferModal(true);
                              }
                           }}
                           disabled={isCartEmpty}
                           className={`h-12 px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 ${isDelivery ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'}`}
                        >
                           <Tag size={16} />
                           <span>{isDelivery ? 'Apply Offer' : 'Offer'}</span>
                        </button>

                        {/* Discount Button (Hidden for Delivery) */}
                        {!isDelivery && (
                           <button
                              onClick={() => {
                                 // After Save Bill (isBilled), only auth discount is allowed
                                 if (isBilled || initialConfig.authDisocuntOnly) {
                                    setShowDiscountAuth(true);
                                 } else {
                                    setShowDiscountModal(true);
                                 }
                              }}
                              disabled={isCartEmpty}
                              className="h-12 px-5 bg-amber-50 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100 active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                           >
                              <Percent size={16} />
                              <span>Discount</span>
                           </button>
                        )}
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end text-right">
                           {orderDiscount.amount > 0 && (
                              <span className="text-[10px] font-bold text-amber-500 line-through decoration-amber-300 decoration-2 leading-none mb-1">
                                 {config.currencySymbol}{(calculateTotal() * (1 + config.taxRate / 100)).toFixed(2)}
                              </span>
                           )}
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Net Payable</span>
                           <span className="text-3xl font-black text-slate-800 leading-none">
                              {config.currencySymbol}
                              {((calculateTotal() * (1 + config.taxRate / 100)) - orderDiscount.amount - calculateOffersDiscount()).toFixed(2)}
                           </span>
                        </div>
                        <button
                           onClick={() => setShowBreakdown(!showBreakdown)}
                           className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showBreakdown ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 shadow-sm'}`}
                        >
                           <Info size={24} />
                        </button>
                     </div>
                  </div>

                  <div className="flex gap-2 h-16 mt-2">
                     {isBilled ? (
                        <button
                           onClick={() => initiateSettlement('settle')}
                           disabled={isCartEmpty}
                           className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                           <CreditCard size={18} />
                           Settle Bill
                        </button>
                     ) : (
                        <>
                           <button
                              onClick={handleCancelOrder}
                              disabled={isCartEmpty}
                              className="flex-1 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200 disabled:opacity-40 disabled:grayscale"
                           >
                              <Trash size={18} />
                              Cancel
                           </button>

                           {isTakeAway ? (
                              <>
                                 <button
                                    onClick={() => initiateSettlement('save')}
                                    disabled={isCartEmpty}
                                    className="flex-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                 >
                                    <Clipboard size={18} />
                                    Save Bill
                                 </button>
                                 <button
                                    onClick={() => initiateSettlement('settle')}
                                    disabled={isCartEmpty}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                 >
                                    <CreditCard size={18} />
                                    Settle Bill
                                 </button>
                              </>
                           ) : isDelivery ? (
                              <div className="flex-[2] flex gap-2">
                                 {/*  <button
                                    onClick={() => initiateSettlement('save')}
                                    disabled={isCartEmpty}
                                    className="flex-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                 >
                                    <Clipboard size={18} />
                                    Save Bill
                                 </button> */}
                                 {(hasUnsaved || !hasSaved || isSavingKOT) ? (
                                    <button
                                       onClick={handleSaveKOT}
                                       disabled={isCartEmpty || isSavingKOT}
                                       className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                       <Save size={18} />
                                       {isSavingKOT ? 'Saving...' : 'Save KOT'}
                                    </button>
                                 ) : <button
                                    onClick={() => initiateSettlement('save')}
                                    className="flex-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    <Clipboard size={18} />
                                    Save Bill
                                 </button>}
                              </div>
                           ) : (
                              (hasUnsaved || !hasSaved || isSavingKOT) ? (
                                 <button
                                    onClick={handleSaveKOT}
                                    disabled={isCartEmpty || isSavingKOT}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                 >
                                    <Save size={18} />
                                    {isSavingKOT ? 'Saving...' : 'Save KOT'}
                                 </button>
                              ) : (
                                 <>
                                    <button
                                       onClick={() => initiateSettlement('save')}
                                       className="flex-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                       <Clipboard size={18} />
                                       Save Bill
                                    </button>
                                    <button
                                       onClick={() => initiateSettlement('settle')}
                                       className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                       <CreditCard size={18} />
                                       Settle Bill
                                    </button>
                                 </>
                              )
                           )}
                        </>
                     )}
                  </div>
               </div>
            </div>


            {/* PART 2 & 3: ITEMS & GROUPS */}

            {
               <>
                  {/* PART 2: ITEMS GRID (Original) */}
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc] border border-slate-200 rounded-2xl">
                     <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-center">
                        <div className="w-full max-w-[100%] relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                           <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search Item..."
                              className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl h-11 pl-12 pr-6 font-bold text-slate-500 outline-none focus:bg-white focus:border-blue-300 transition-all text-sm shadow-inner"
                           />

                           {/* Suggestion List */}
                           {suggestedItems.length > 0 && (
                              <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-2xl shadow-2xl border border-slate-100 z-[500] overflow-hidden">
                                 <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Quick Results</span>
                                    <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400"><X size={14} /></button>
                                 </div>
                                 <div className="max-h-[400px] overflow-y-auto p-1.5 space-y-1">
                                    {suggestedItems.map(item => {
                                       const isVirtual = item.type === 'CHOICE_ITEM' || item.type === 'COMBO_ITEM';
                                       const displayLabel = isVirtual ? item.displayName : item.name;
                                       const displayPrice = isVirtual
                                          ? (item.type === 'COMBO_ITEM'
                                             ? (item.variants || []).reduce((sum, v) => sum + (parseFloat(v.price) * (v.qty || 1)), 0)
                                             : null)
                                          : item.price;
                                       const typeTag = item.type === 'COMBO_ITEM' ? 'COMBO' : item.type === 'CHOICE_ITEM' ? 'CHOICE' : null;
                                       return (
                                          <button
                                             key={item.id}
                                             onClick={() => {
                                                addToCart(item);
                                                setSearchTerm('');
                                             }}
                                             className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100"
                                          >
                                             <div className='text-left'>
                                                {typeTag ? (
                                                   <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${item.type === 'COMBO_ITEM' ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>
                                                      {typeTag}
                                                   </span>
                                                ) : (
                                                   <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">{item.id}</span>
                                                )}
                                             </div>
                                             <div className="flex-1 text-left">
                                                <div className="flex justify-between items-start">
                                                   <span className="text-xs font-black text-slate-700 uppercase leading-none">{displayLabel}</span>
                                                   {displayPrice != null && (
                                                      <span className="text-xs font-black text-blue-600">₹{displayPrice}</span>
                                                   )}
                                                </div>
                                                {!isVirtual && (
                                                   <div className="flex justify-between items-center mt-1">
                                                      <span className="text-[14px] font-bold text-slate-400 ar-font leading-none">{item.arName}</span>
                                                   </div>
                                                )}
                                             </div>
                                          </button>
                                       );
                                    })}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-4 gap-2">
                           {allDisplayItems.map(item => (
                              <ItemTile key={item.id} item={item} onAdd={() => addToCart(item)} isLocked={isBilled} />
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* PART 3: GROUP LIST */}
                  <div className="w-[250px] bg-[#f8fafc] border border-slate-200 rounded-2xl flex flex-col overflow-hidden ml-0">
                     <div className="p-3 shrink-0 bg-white space-y-3">
                        <div className="relative group">
                           <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                           <input
                              type="text"
                              value={groupSearch}
                              onChange={(e) => setGroupSearch(e.target.value)}
                              placeholder="Search Group..."
                              className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl h-11 pl-10 pr-3 text-sm font-bold text-slate-400 focus:bg-white focus:border-blue-300 outline-none transition-all shadow-inner"
                           />
                        </div>
                        <div className="flex gap-1.5 h-12">
                           <button onClick={() => moveGroup('up')} className="flex-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:translate-y-0.5">
                              <ChevronUp size={20} />
                           </button>
                           <button onClick={() => moveGroup('down')} className="flex-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:translate-y-0.5">
                              <ChevronDown size={20} />
                           </button>
                        </div>
                     </div>

                     <div
                        ref={groupListRef}
                        className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-5 bg-slate-50/50"
                     >
                        {/* Master Products (Virtual) */}
                        {filteredGroups.filter(g => g.type === 'virtual').length > 0 && (
                           <div className="space-y-3">
                              <div className="px-2 flex items-center gap-2">
                                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Combos / Choice</span>
                                 <div className="flex-1 h-[1px] bg-emerald-100" />
                              </div>
                              <div className="grid grid-cols-1 gap-2.5">
                                 {filteredGroups.filter(g => g.type === 'virtual').map((group) => (
                                    <button
                                       key={group.id}
                                       id={`group-btn-${group.id}`}
                                       onClick={() => setActiveGroup(group.id)}
                                       className={`w-full h-16 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center transition-all group relative border-2 ${activeGroup === group.id ? 'bg-emerald-600 text-white border-emerald-700 shadow-xl scale-[1.02]' : 'bg-emerald-100 text-emerald-800 border-emerald-200'} active:scale-95 shadow-xs`}
                                    >
                                       <span className="text-[11px] font-black uppercase tracking-wider leading-tight">{group.name}</span>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* Collections Section */}
                        <div className="space-y-3">
                           <div className="px-2 flex items-center gap-2">
                              <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-widest">Collections</span>
                              <div className="flex-1 h-[1px] bg-fuchsia-100" />
                           </div>
                           <div className="grid grid-cols-1 gap-2.5">
                              {filteredGroups.filter(g => g.type === 'organizer').map((group) => (
                                 <button
                                    key={group.id}
                                    id={`group-btn-${group.id}`}
                                    onClick={() => setActiveGroup(group.id)}
                                    className={`w-full h-16 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center transition-all group relative border-2 ${activeGroup === group.id ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-xl scale-[1.02]' : 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'} active:scale-95 shadow-xs`}
                                 >
                                    <span className="text-[11px] font-black uppercase tracking-wider leading-tight">{group.name}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Categories Section */}
                        <div className="space-y-3">
                           <div className="px-2 flex items-center gap-2">
                              <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Groups</span>
                              <div className="flex-1 h-[1px] bg-sky-100" />
                           </div>
                           <div className="grid grid-cols-1 gap-2.5">
                              {filteredGroups.filter(g => g.type === 'group').map((group) => (
                                 <button
                                    key={group.id}
                                    id={`group-btn-${group.id}`}
                                    onClick={() => setActiveGroup(group.id)}
                                    className={`w-full h-16 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center transition-all group relative border-2  ${activeGroup === group.id ? 'bg-sky-600 text-white border-sky-700 shadow-xl scale-[1.02]' : 'bg-sky-100 text-sky-800 border-sky-200'} active:scale-95 shadow-xs`}
                                 >
                                    <span className="text-[11px] font-black uppercase tracking-wider leading-tight">{group.name}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </>
            }
         </div>

         {/* MODALS */}
         <AnimatePresence>
            {showOrderChoice && (
               <OrderTypeChoiceModal
                  isOpen={showOrderChoice}
                  onClose={() => setShowOrderChoice(false)}
                  onSelect={(type) => {
                     setConfig({ ...config, defaultKotType: type });
                     setShowOrderChoice(false);
                     setTimeout(() => initiateSettlement(pendingChoiceAction, true), 100);
                  }}
                  initialConfig={config}
               />
            )}
            {showExtrasModal && (
               <div key="extras-modal" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExtrasModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 p-8">
                     <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Info size={20} /></div>
                           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Item Preferences</h3>
                        </div>
                        <button onClick={() => setShowExtrasModal(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"><X size={20} /></button>
                     </div>



                     {/* Cooking Info / Tags */}
                     <div className="mb-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2.5 block">Cooking Instructions</span>
                        <div className="relative group">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                           <input
                              type="text"
                              value={instructionSearch}
                              onChange={(e) => setInstructionSearch(e.target.value)}
                              placeholder="Search or type custom instruction..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-12 pl-12 pr-28 font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 shadow-sm transition-all"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter' && instructionSearch.trim()) {
                                    if (!modalInstructions.includes(instructionSearch.trim())) {
                                       setModalInstructions([...modalInstructions, instructionSearch.trim()]);
                                    }
                                    setInstructionSearch('');
                                 }
                              }}
                           />
                           {instructionSearch.trim() && (
                              <button
                                 onClick={() => {
                                    if (!modalInstructions.includes(instructionSearch.trim())) {
                                       setModalInstructions([...modalInstructions, instructionSearch.trim()]);
                                    }
                                    setInstructionSearch('');
                                 }}
                                 className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                              >
                                 Add
                              </button>
                           )}

                           {/* Suggestion Popup List */}
                           {instructionSearch.trim() && (
                              <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-2xl shadow-2xl border border-slate-100 z-[510] overflow-hidden">
                                 <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-1">
                                    {cookingInstructionsDb
                                       .filter(instObj => {
                                          const searchStr = typeof instObj === 'string' ? instObj : instObj.name;
                                          return searchStr && searchStr.toLowerCase().includes(instructionSearch.toLowerCase());
                                       })
                                       .slice(0, 8)
                                       .map((instObj, i) => {
                                          const inst = typeof instObj === 'string' ? instObj : instObj.name;
                                          return (
                                             <button
                                                key={i}
                                                onClick={() => {
                                                   if (!modalInstructions.includes(inst)) {
                                                      setModalInstructions([...modalInstructions, inst]);
                                                   }
                                                   setInstructionSearch('');
                                                }}
                                                className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-between group"
                                             >
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide group-hover:text-blue-600">{inst}</span>
                                                <Plus size={14} className="text-slate-300 group-hover:text-blue-500" />
                                             </button>
                                          )
                                       })}
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Chips Container */}
                        <div className="flex flex-wrap gap-2 mt-4 min-h-[40px] p-1">
                           {modalInstructions.map((tag, i) => (
                              <motion.div
                                 initial={{ scale: 0.8, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 key={i}
                                 className="flex items-center gap-1.5 bg-blue-600 text-white pl-3 pr-2 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95"
                              >
                                 {tag}
                                 <button onClick={() => setModalInstructions(modalInstructions.filter((_, idx) => idx !== i))} className="w-4 h-4 rounded-full bg-blue-700 flex items-center justify-center hover:bg-blue-800 transition-all"><X size={10} /></button>
                              </motion.div>
                           ))}
                           {modalInstructions.length === 0 && <span className="text-[10px] text-slate-300 font-bold italic py-2 ml-1">No instructions added...</span>}
                        </div>
                     </div>

                     {/* Parcel Toggle */}
                     <div className="flex items-center justify-between bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 mb-3">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${modalParcel ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                              <Package size={24} />
                           </div>
                           <div>
                              <span className="text-md font-black text-slate-800">Parcel Item</span>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mark for separate packing</p>
                           </div>
                        </div>
                        <button
                           onClick={() => setModalParcel(!modalParcel)}
                           className={`w-14 h-8 rounded-full relative transition-all duration-300 ${modalParcel ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-slate-300'}`}
                        >
                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${modalParcel ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowExtrasModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[12px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                        <button
                           onClick={() => {
                              setCart(cart.map(c => c.cartId === showExtrasModal ? { ...c, isParcel: modalParcel, notes: modalInstructions } : c));
                              setShowExtrasModal(null);
                              notify('Item preferences updated', 'success');
                           }}
                           className="flex-[2] py-4 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
                        >
                           Save Changes
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}

            {showOfferAuth && (
               <AuthorizerModal
                  key="offer-auth-modal"
                  isOpen={showOfferAuth}
                  onClose={() => setShowOfferAuth(false)}
                  onAuthorize={(authorizer) => {
                     setShowOfferAuth(false);
                     setShowOfferModal(true);
                  }}
                  permissionKey="offerDisc"
                  title="Offer Authorization"
                  message="Authorization required to add/modify offers on a saved bill."
               />
            )}

            {showOpenItemRate && (
               <SmallRatePopup
                  item={showOpenItemRate}
                  onClose={() => setShowOpenItemRate(null)}
                  onConfirm={handleOpenItemConfirm}
                  value={rateInput}
                  setValue={setRateInput}
               />
            )}

            {showSettlementModal && (
               <SettlementModal
                  key="settlement-modal"
                  type={settlementType}
                  table={selectedTable}
                  total={((calculateTotal() * (1 + config.taxRate / 100)) - orderDiscount.amount - calculateOffersDiscount()).toFixed(2)}
                  onClose={() => setShowSettlementModal(false)}
                  orderType={config.defaultKotType}
                  onProcess={async (msg, paymentData) => {
                     try {
                        const orderType = config.defaultKotType;
                        let activeOrder = null;

                        if (selectedTable?.orderId) {
                           activeOrder = await getOrderById(selectedTable.orderId);
                        }

                        if (!activeOrder && orderType === 'DI' && selectedTable) {
                           activeOrder = await getOrderByTable(selectedTable.id);
                        }

                        if (!activeOrder) {
                           activeOrder = {
                              id: "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                              type: orderType,
                              tableId: orderType === 'DI' ? selectedTable.id : null,
                              waiterId: selectedWaiter?.id || null,
                              customerId: selectedCustomer?.id || null,
                              deliveryAgentId: deliveryAgent?.id || null,
                              pax: parseInt(pax) || 1,
                              status: 'running',
                              subTotal: 0,
                              discount: 0,
                              taxes: 0,
                              grandTotal: 0,
                              offerDetails: null,
                              orderDescription: orderNotes || '',
                              invoiceNo: null,
                              latestKotNo: 0,
                              createTime: new Date().toISOString(),
                              payType: null
                           };

                           // If user settles with zero cost cart...
                           // Just secure the ID mapping immediately
                           await saveToStore(ORDERS_STORE, activeOrder);
                        }

                        const nextKotNo = await generateKotNo(activeOrder.type);
                        activeOrder.latestKotNo = nextKotNo;
                        const newCartItems = cart.filter(c => !c.isSaved);

                        for (const item of newCartItems) {
                           const orderItemId = "ITM_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
                           const isChoice = item.type === 'CHOICE';
                           const isCombo = item.type === 'COMBO';

                           await saveToStore(ORDER_ITEMS_STORE, {
                              id: orderItemId,
                              orderId: activeOrder.id,
                              kotNo: nextKotNo,
                              itemId: item.id,
                              isChoice: isChoice,
                              variantId: isChoice ? item.variantName : null,
                              isCombo: isCombo,
                              comboId: isCombo ? item.id : null,
                              qty: item.qty,
                              price: item.price,
                              itemTax: 0,
                              isParcel: item.isParcel || false,
                              cookingInstructions: item.modifiers || [],
                              offerDetails: null,
                              status: 'active',
                              cancelReason: null,
                              cancelTime: null,
                              addedTime: new Date().toISOString()
                           });

                           if (item.addons && item.addons.length > 0) {
                              for (const addon of item.addons) {
                                 await saveToStore(ORDER_ITEM_ADDONS_STORE, {
                                    id: "ADDON_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
                                    orderItemId: orderItemId,
                                    addonId: addon.id,
                                    price: parseFloat(addon.price) || 0,
                                    qty: item.qty
                                 });
                              }
                           }
                        }

                        // Modify order status based on Settlement Type
                        const isNC = paymentData?.method === 'NC';
                        activeOrder.status = (settlementType === 'save' && !isNC) ? 'billed' : 'settled';

                        const timestamp = Math.floor(Date.now() / 1000).toString().substring(4);
                        const prefix = isNC ? 'NC-' : 'INV-';

                        if (settlementType === 'save' && !isNC) {
                           activeOrder.invoiceNo = activeOrder.invoiceNo || prefix + timestamp;
                           activeOrder.billTime = activeOrder.billTime || new Date().toISOString();
                        } else {
                           activeOrder.invoiceNo = activeOrder.invoiceNo || prefix + timestamp;
                           activeOrder.billTime = activeOrder.billTime || new Date().toISOString();
                           activeOrder.settleTime = new Date().toISOString();
                           activeOrder.settleUser = config.activeUserId || null;
                           activeOrder.payType = isNC ? 'NC' : (paymentData ? (paymentData.isMulti ? 'MULTI' : paymentData.method) : null);
                        }

                        activeOrder.subTotal = calculateTotal();
                        activeOrder.taxes = activeOrder.subTotal * ((config.taxRate || 0) / 100);

                        if (isNC) {
                           activeOrder.discount = activeOrder.subTotal + (activeOrder.taxes || 0);
                        } else {
                           activeOrder.discount = (orderDiscount?.amount || 0) + calculateOffersDiscount();
                        }

                        activeOrder.offerDetails = appliedOffers;
                        activeOrder.grandTotal = (activeOrder.subTotal + activeOrder.taxes) - activeOrder.discount;

                        await saveToStore(ORDERS_STORE, activeOrder);

                        // Deduct Sold Out Items
                        await decrementTrackedItemQuants(newCartItems);
                        getSoldOutTracking().then(data => setSoldOutTracking(data || []));

                        const finalMsg = isNC ? 'NC KOT Generated successfully' : (settlementType === 'save' ? 'Bill Generated successfully' : 'Bill Settled successfully');
                        notify(finalMsg, 'success');
                        setShowSettlementModal(false);

                        if (settlementType === 'save' && !isNC) {
                           clearCurrentOrder();
                           setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
                           setAppliedOffers([]);
                           if (orderType === 'DI') {
                              navigate('/tables');
                           }
                        } else {
                           // settle OR isNC
                           setShowPrintConfirm(true);
                           // Order context remains so PrintReceipt knows what it just settled!
                        }
                     } catch (err) {
                        console.error("Failed to commit settlement to IDB:", err);
                        notify("Failed to commit transaction", 'error');
                     }
                  }}
               />
            )}

            <PrintBillModal
               key="print-bill-modal"
               isOpen={showPrintConfirm}
               onConfirm={() => {
                  notify('Printing receipt...', 'info');
                  setShowPrintConfirm(false);
                  const orderType = config.defaultKotType;
                  clearCurrentOrder();
                  setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
                  setAppliedOffers([]);
                  if (orderType === 'DI') {
                     navigate('/tables');
                  }
               }}
               onCancel={() => {
                  setShowPrintConfirm(false);
                  const orderType = config.defaultKotType;
                  clearCurrentOrder();
                  setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
                  setAppliedOffers([]);
                  if (orderType === 'DI') {
                     navigate('/tables');
                  }
               }}
            />

            {showOfferModal && (
               <OfferModal
                  key="offer-modal"
                  isOpen={showOfferModal}
                  onClose={() => setShowOfferModal(false)}
                  cart={cart}
                  appliedOffers={appliedOffers}
                  onApplyOffer={handleApplyOffer}
                  onRemoveOffer={(offerId) => {
                     if (offerId === 'ALL') {
                        setAppliedOffers([]);
                        notify('All offers cleared', 'info');
                     } else {
                        setAppliedOffers(appliedOffers.filter(o => o.offer.id !== offerId));
                        notify('Offer removed', 'info');
                     }
                  }}
                  onDone={handleOfferModalDone}
                  calculateTotal={calculateTotal}
                  currencySymbol={config.currencySymbol}
                  config={config}
               />
            )}

            {showPaxModal && (
               <PaxModal
                  key="pax-modal"
                  isOpen={showPaxModal}
                  table={selectedTable}
                  paxInput={paxInput}
                  setPaxInput={setPaxInput}
                  onClose={() => setShowPaxModal(false)}
                  onAccept={() => {
                     setPax(parseInt(paxInput) || 1);
                     setShowPaxModal(false);
                  }}
               />
            )}

            {showCustomerModal && (
               <CustomerModal
                  key="customer-modal"
                  isOpen={showCustomerModal}
                  onClose={() => setShowCustomerModal(false)}
                  onSuccess={() => {
                     const action = pendingAction;
                     if (action === 'KOT') {
                        // pendingAction will be cleared in handleSaveKOT(true)
                        handleSaveKOT(true);
                     }
                  }}
               />
            )}

            {showDeliveryModal && (
               <DeliveryAgentModal
                  key="delivery-modal"
                  isOpen={showDeliveryModal}
                  onClose={() => setShowDeliveryModal(false)}
                  selectedAgent={deliveryAgent}
                  onSelect={(agent) => {
                     setDeliveryAgent(agent);
                     const action = pendingAction;
                     setPendingAction(null);
                     if (action === 'SAVE_BILL') {
                        setSettlementType('save');
                        setShowSettlementModal(true);
                     }
                  }}
               />
            )}

            {showNotesModal && (
               <NotesModal
                  key="notes-modal"
                  isOpen={showNotesModal}
                  onClose={() => setShowNotesModal(false)}
               />
            )}

            {showDiscountModal && (
               <DiscountModal
                  isOpen={showDiscountModal}
                  onClose={() => setShowDiscountModal(false)}
                  orderValue={calculateTotal() * (1 + config.taxRate / 100)}
                  config={config}
                  notify={notify}
                  preAuthorized={isDiscountAuth}
                  onApply={(discount) => {
                     if (discount.percentage > config.cashierDiscountLimit && !isDiscountAuth) {
                        setPendingDiscount(discount);
                        setShowDiscountAuth(true);
                     } else {
                        setOrderDiscount(discount);
                        setAppliedOffers([]); // Offers and manual discount are mutually exclusive for bill
                        notify('Manual discount applied', 'success');
                     }
                  }}
               />
            )}

            {showDiscountAuth && (
               <AuthorizerModal
                  isOpen={showDiscountAuth}
                  onClose={() => {
                     setShowDiscountAuth(false);
                     setPendingDiscount(null);
                  }}
                  onAuthorize={(user) => {
                     if (pendingDiscount) {
                        setOrderDiscount(pendingDiscount);
                        setOrderDiscountAuthUser(user.id);
                        notify(`Discount authorized by ${user.name}`, 'success');
                        setPendingDiscount(null);
                     }
                     setShowDiscountAuth(false);
                  }}
                  permissionKey="discountDisc"
                  title="Management Override"
                  message={`Authorization required for discount exceeding ${config.cashierDiscountLimit}%.`}
               />
            )}


            {showTableConfirm && (
               <ConfirmationModal
                  key="table-confirm-modal"
                  isOpen={showTableConfirm}
                  title="Change Table?"
                  message="You have items in your cart. Switching tables will discard these current items. Are you sure?"
                  confirmText="Discard & Change"
                  cancelText="Stay Here"
                  onCancel={() => setShowTableConfirm(false)}
                  onConfirm={async () => {
                     // Deduct Sold Out Items
                     await decrementTrackedItemQuants(cart); // Assuming 'cart' here represents the items to be discarded
                     getSoldOutTracking().then(data => setSoldOutTracking(data || []));

                     setShowWaiterView(false);
                     setShowTableConfirm(false);
                     navigate('/tables');
                  }}
               />
            )}

            {showVoidConfirm && (
               <ConfirmationModal
                  key="void-confirm-modal"
                  isOpen={showVoidConfirm}
                  title="Cancel Entire Order?"
                  message="This will cancel all items currently in the kitchen for this table. Continue?"
                  confirmText="Yes, Cancel Order"
                  cancelText="No"
                  onCancel={() => setShowVoidConfirm(false)}
                  onConfirm={() => {
                     setShowVoidConfirm(false);
                     setShowCancelModal('ALL');
                  }}
               />
            )}

            {showCancelModal && (
               <VoidItemModal
                  key="cancel-modal"
                  isOpen={!!showCancelModal}
                  item={showCancelModal === 'ALL' ? { name: 'Full Order', cartId: 'ALL', price: 0, qty: 1 } : showCancelModal}
                  onClose={() => setShowCancelModal(null)}
                  notify={notify}
                  hasPermission={false} // Default to false to require auth
                  onConfirm={async (item, reason, cancelQuantity) => {
                     if (item.cartId === 'ALL') {
                        try {
                           if (selectedTable?.orderId) {
                              const order = await getOrderById(selectedTable.orderId);
                              if (order) {
                                 order.status = 'cancelled';
                                 order.cancelReason = reason;
                                 order.cancelTime = new Date().toISOString();
                                 await saveToStore(ORDERS_STORE, order);

                                 // Also cancel all individual items in IDB
                                 const items = await getOrderItems(order.id);
                                 for (const oi of items) {
                                    oi.status = 'cancelled';
                                    oi.cancelReason = reason;
                                    oi.cancelTime = order.cancelTime;
                                    await saveToStore(ORDER_ITEMS_STORE, oi);
                                 }
                              }
                           }
                           setCart([]);
                           setOrderDiscount({ type: 'percentage', value: 0, amount: 0, percentage: 0 });
                           setAppliedOffers([]);
                           clearCurrentOrder();
                           navigate('/tables');
                           notify(`Full Order Cancelled (${reason})`, 'success');
                        } catch (err) {
                           console.error("Cancellation Failed", err);
                           notify("Order cancellation failed", "error");
                        }
                     } else {
                        // Single Item Cancel/Void
                        setCart(cart.map(c => {
                           if (c.cartId === item.cartId) {
                              const remainingQty = c.qty - cancelQuantity;
                              if (remainingQty <= 0) return null;
                              return { ...c, qty: remainingQty };
                           }
                           return c;
                        }).filter(Boolean));
                        notify(`${item.name} x${cancelQuantity} Cancelled (${reason})`, 'success');
                     }
                     setShowCancelModal(null);
                  }}
               />
            )}
            {showProductModal && (
               <ProductSelectionModal
                  key="product-selection-modal"
                  product={showProductModal.product}
                  cartItem={showProductModal.cartItem}
                  onClose={() => setShowProductModal(null)}
                  onConfirm={handleProductConfirm}
                  initialConfig={initialConfig}
                  dbAddons={dbAddons}
               />
            )}

            {showAddonModal && (
               <div key="addon-modal" className="fixed inset-0 z-[310] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddonModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 p-8">
                     <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Plus size={20} /></div>
                           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Addons</h3>
                        </div>
                        <button onClick={() => setShowAddonModal(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"><X size={20} /></button>
                     </div>

                     <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto no-scrollbar pb-4">
                        {showAddonModal.availableAddons.map((addon) => {
                           const isSelected = (cart.find(c => c.cartId === showAddonModal.cartId)?.addons || []).some(a => a.id === addon.id);
                           return (
                              <button
                                 key={addon.id}
                                 onClick={() => handleAddonToggle(showAddonModal.cartId, addon)}
                                 className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group active:scale-95 border-2 ${isSelected ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                                       <Check size={14} strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                       <span className={`block text-sm font-black uppercase transition-colors ${isSelected ? 'text-orange-700' : 'text-slate-600'}`}>{addon.displayName}</span>
                                    </div>
                                 </div>
                                 <span className={`text-md font-black tracking-tighter ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>+ {initialConfig.currencySymbol} {parseFloat(addon.price).toFixed(2)}</span>
                              </button>
                           );
                        })}
                     </div>

                     <button
                        onClick={() => setShowAddonModal(null)}
                        className="w-full mt-6 py-4 bg-[#1e56a0] hover:bg-[#1a4a8a] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
                     >
                        Done
                     </button>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

const CartRow = ({ item, onQtyChange, onCancel, onExtras, onPriceChange, onRateEdit, isLocked, onAddon, showAddonButton }) => {
   return (
      <div className={`bg-white border rounded-2xl p-3 flex flex-col mb-1.5 transition-all group ${item.isSaved ? 'border-amber-100' : 'border-slate-100 hover:border-blue-100 shadow-sm'} ${isLocked ? 'opacity-80' : ''}`}>
         <div className="flex items-center min-h-12">
            <button
               onClick={() => onCancel(item)}
               disabled={isLocked}
               className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-all shrink-0 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
               <Trash size={16} strokeWidth={3} />
            </button>

            <div className="flex-1 px-2 flex flex-col overflow-hidden">
               <span className="text-xs font-black text-slate-800 uppercase leading-none truncate">{item.name}</span>

               {/* Variant / Combo Contents */}
               {item.variantName && (
                  <span className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Variant: {item.variantName}</span>
               )}
               {item.contents && item.contents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                     {item.contents.map((c, i) => (
                        <span key={i} className="text-[8px] font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded uppercase">{c.displayName} x{c.qty}</span>
                     ))}
                  </div>
               )}

               <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.isParcel && <span className="text-[8px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Parcel</span>}
                  {item.notes && (Array.isArray(item.notes) ? item.notes : [item.notes]).map((note, i) => (
                     <span key={i} className="text-[7px] font-black bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded uppercase tracking-tighter max-w-[80px] truncate">{note}</span>
                  ))}
                  {/* Addons Display */}
                  {item.addons && item.addons.map((addon, i) => (
                     <span key={i} className="text-[7px] font-black bg-orange-50 text-orange-500 border border-orange-100 px-1.5 py-0.5 rounded uppercase tracking-tighter max-w-[80px] truncate">{addon.displayName}</span>
                  ))}
               </div>
            </div>             <div className="w-32 flex items-center justify-center gap-3">
               <button
                  disabled={isLocked}
                  onClick={() => onQtyChange(item.cartId, -1)}
                  className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-600 shadow-inner disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  <Minus size={14} />
               </button>
               <input
                  type="text"
                  value={item.qty}
                  readOnly
                  className="w-8 h-8 text-center bg-transparent text-sm font-bold text-slate-600 rounded focus:border focus:border-slate-400 focus:outline-none"
               />
               <button
                  disabled={isLocked}
                  onClick={() => onQtyChange(item.cartId, 1)}
                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-lg active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  <Plus size={14} />
               </button>
            </div>
            <div className="w-24 flex flex-col items-end">
               {item.openItem ? (
                  <div className="flex items-center gap-1">
                     <span className="text-[11px] font-black text-blue-600">{initialConfig.currencySymbol} {parseFloat(item.price).toFixed(2)}</span>
                     {!isLocked && (
                        <button
                           onClick={() => onRateEdit(item)}
                           className="p-1 hover:bg-blue-50 text-blue-400 rounded transition-all"
                           title="Edit Rate"
                        >
                           <Tag size={14} />
                        </button>
                     )}
                  </div>
               ) : (
                  <span className="text-[10px] font-black text-slate-400">{initialConfig.currencySymbol} {((item.price + (item.addons?.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0) || 0))).toFixed(2)}</span>
               )}
               <span className="text-sm font-black text-slate-800">{initialConfig.currencySymbol} {((item.price + (item.addons?.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0) || 0)) * item.qty).toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1 ml-4 shrink-0">
               <button
                  onClick={onExtras}
                  disabled={isLocked}
                  className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-500 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Preferences"
               >
                  <Info size={14} />
               </button>
               {showAddonButton && (
                  <button
                     onClick={() => onAddon(item.cartId)}
                     disabled={isLocked}
                     className="w-8 h-8 bg-slate-100 text-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                     title="Addons"
                  >
                     <Plus size={14} />
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

const ItemTile = ({ item, onAdd, isLocked }) => {
   const [imgError, setImgError] = React.useState(false);

   // Calculate Combo Price or Hide Choice Price
   const displayPrice = React.useMemo(() => {
      if (item.type === 'CHOICE_ITEM') return null;
      if (item.type === 'COMBO_ITEM') {
         return (item.variants || []).reduce((sum, v) => sum + (parseFloat(v.price) * (v.qty || 1)), 0);
      }
      return parseFloat(item.price) || 0;
   }, [item]);

   // Calculate Diet Type based on priority: non-veg > egg > veg
   const displayDietType = React.useMemo(() => {
      if (item.type === 'CHOICE_ITEM' || item.type === 'COMBO_ITEM') {
         const variantIds = (item.variants || []).map(v => v.itemId);
         const constituentItems = itemsDb.filter(i => variantIds.includes(i.id));

         const hasNonVeg = constituentItems.some(i => i.dietType === 'non-veg');
         const hasEgg = constituentItems.some(i => i.dietType === 'egg');

         if (hasNonVeg) return 'non-veg';
         if (hasEgg) return 'egg';
         return 'veg';
      }
      return item.dietType || 'veg';
   }, [item]);

   const dietColor = displayDietType === 'veg' ? 'bg-[#10b981]' : (displayDietType === 'egg' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]');

   return (
      <button
         onClick={onAdd}
         disabled={isLocked || item.soldOut}
         className={`bg-white border border-slate-200 rounded-2xl flex flex-col transition-all hover:border-blue-400 hover:shadow-md active:scale-95 group shadow-sm text-left relative overflow-hidden h-full min-h-[150px] ${item.soldOut || isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
      >
         <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
            {item.image && !imgError ? (
               <img
                  src={item.image}
                  alt={item.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
               />
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-4">
                  <ShoppingCart size={32} strokeWidth={1.5} className="opacity-20 mb-2" />
                  <span className="font-black text-[10px] uppercase tracking-widest opacity-40">No Image</span>
               </div>
            )}

            {/* Floating Price Box */}
            {displayPrice !== null && (
               <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-100 px-3 py-1.5 rounded-xl shadow-m flex items-center justify-center z-10">
                  <span className="text-[12px] font-bold text-blue-600 tracking-tighter">{initialConfig.currencySymbol} {displayPrice.toFixed(2)}</span>
               </div>
            )}
         </div>

         <div className="flex-1 flex relative bg-white">
            {/* Status Indicator Bar */}
            <div className={`w-1.5 h-full ${dietColor}`} />

            <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
               <div className="flex justify-end h-4">
                  <span className="text-[15px] font-bold text-slate-500 ar-font leading-none">{item.arName}</span>
               </div>
               <div className="mt-1">
                  <h4 className="font-bold text-[14px] text-slate-800 leading-tight line-clamp-2 uppercase">{item.displayName || item.name}</h4>
               </div>
               {item.openItem ? (
                  <p className="text-[9px] mt-1 font-bold bg-emerald-600 text-white text-center px-1.5 py-0.5 rounded uppercase tracking-[0.1em]">Open Item</p>
               ) : (item.soldOut ? (
                  <p className="text-[9px] mt-1 font-bold bg-red-600 text-white text-center px-1.5 py-0.5 rounded uppercase tracking-[0.1em]">Sold Out</p>
               ) : null)}

            </div>

         </div>
      </button>
   );
};

const ProductSelectionModal = ({ product, cartItem, onClose, onConfirm, initialConfig, dbAddons }) => {
   const [selectedVariant, setSelectedVariant] = useState(
      cartItem ? product.variants.find(v => v.displayName === cartItem.variantName) : null
   );
   const [selectedAddons, setSelectedAddons] = useState(cartItem?.addons || []);

   const isChoice = product.type === 'CHOICE_ITEM';
   const productAddons = product.addons || [];

   const handleToggleAddon = (addon) => {
      setSelectedAddons(prev =>
         prev.find(a => a.id === addon.id)
            ? prev.filter(a => a.id !== addon.id)
            : [...prev, addon]
      );
   };

   const calculateBasePrice = () => {
      if (isChoice) return selectedVariant ? parseFloat(selectedVariant.price) : 0;
      return (product.variants || []).reduce((sum, v) => sum + (parseFloat(v.price) * (v.qty || 1)), 0);
   };

   const totalAddonsPrice = selectedAddons.reduce((sum, a) => sum + parseFloat(a.price), 0);
   const finalPrice = calculateBasePrice() + totalAddonsPrice;

   return (
      <div className="fixed inset-0 z-[310] flex items-center justify-center p-4">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
         <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className={`p-6 pt-4 pb-4 flex justify-between items-center border-b border-slate-50`}>
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isChoice ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} rounded-xl flex items-center justify-center`}>
                     {isChoice ? <Layers size={20} /> : <Package size={20} />}
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{product.displayName}</h3>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{isChoice ? 'Select Variant' : 'Combo Contents'}</span>
                  </div>
               </div>
               <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-4 space-y-6">
               {/* Left Half: Variants or Contents */}
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                     {isChoice ? 'Choices' : 'Includes'}
                  </h4>
                  {isChoice ? (
                     <div className="grid grid-cols-3 gap-1.5">
                        {product.variants.map((variant, i) => (
                           <button
                              key={i}
                              onClick={() => setSelectedVariant(variant)}
                              className={`w-full p-2.5 px-4 rounded-xl flex items-center justify-between transition-all border-2 group ${selectedVariant?.displayName === variant.displayName ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-100/50'}`}
                           >
                              <div className="flex items-center gap-3 text-left">
                                 <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${selectedVariant?.displayName === variant.displayName ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                                    <Check size={12} strokeWidth={3} />
                                 </div>
                                 <div>
                                    <span className={`block text-[13px] font-black uppercase ${selectedVariant?.displayName === variant.displayName ? 'text-emerald-700' : 'text-slate-600'}`}>{variant.displayName}</span>
                                 </div>
                              </div>
                              <span className={`text-[15px] font-black tracking-tighter ${selectedVariant?.displayName === variant.displayName ? 'text-emerald-600' : 'text-slate-400'}`}>{initialConfig.currencySymbol} {parseFloat(variant.price).toFixed(2)}</span>
                           </button>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-wrap gap-2">
                        {product.variants.map((item, i) => (
                           <div key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2">
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 w-5 h-5 rounded-full flex items-center justify-center border border-blue-100">{item.qty || 1} x</span>
                              <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{item.displayName}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Addons Section */}
               {productAddons.length > 0 && (
                  <div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Addons
                     </h4>
                     <div className="grid grid-cols-2 gap-2">
                        {productAddons.map((addon) => {
                           const isSelected = selectedAddons.some(a => a.id === addon.id);
                           return (
                              <button
                                 key={addon.id}
                                 onClick={() => handleToggleAddon(addon)}
                                 className={`p-3 rounded-xl flex items-center justify-between transition-all group border-2 ${isSelected ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-slate-50 border-slate-100/50'}`}
                              >
                                 <div className="flex items-center gap-2 text-left">
                                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                                       <Check size={10} strokeWidth={4} />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase ${isSelected ? 'text-orange-700' : 'text-slate-600'}`}>{addon.displayName}</span>
                                 </div>
                                 <span className={`text-[11px] font-black tracking-tighter ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>+{parseFloat(addon.price).toFixed(0)}</span>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               )}
            </div>

            <div className="p-6 bg-slate-50 flex items-center gap-6">
               <div className="flex-1">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Total Amount</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-slate-800 tracking-tighter">{initialConfig.currencySymbol} {finalPrice.toFixed(2)}</span>
                     {totalAddonsPrice > 0 && <span className="text-[11px] font-bold text-orange-500">({initialConfig.currencySymbol}{calculateBasePrice().toFixed(0)} + {totalAddonsPrice.toFixed(0)})</span>}
                  </div>
               </div>
               <button
                  onClick={() => onConfirm(product, selectedVariant, selectedAddons)}
                  disabled={isChoice && !selectedVariant}
                  className={`px-8 py-4 font-black rounded-xl shadow-m active:scale-95 transition-all uppercase text-[11px] tracking-[0.2em] flex items-center gap-2 ${isChoice && !selectedVariant ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
               >
                  {cartItem ? 'Update Order' : 'Add to Cart'}
                  <Check size={16} />
               </button>
            </div>
         </motion.div>
      </div>
   );
};

export const SmallRatePopup = ({ item, onClose, onConfirm, value, setValue }) => {
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key >= '0' && e.key <= '9') {
            setValue(prev => (prev === '0' && e.key !== '.' ? e.key : prev + e.key));
         } else if (e.key === '.') {
            setValue(prev => (prev.includes('.') ? prev : prev + '.'));
         } else if (e.key === 'Backspace') {
            setValue(prev => prev.slice(0, -1));
         } else if (e.key === 'Enter') {
            onConfirm();
         } else if (e.key === 'Escape') {
            onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [setValue, onConfirm, onClose]);

   if (!item) return null;
   return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
         <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 text-center border-b border-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enter Rate for</span>
               <h3 className="text-lg font-black text-slate-800 uppercase leading-tight">{item.name}</h3>
            </div>
            <div className="p-6">
               <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 shadow-inner">
                  <div className="flex items-center justify-center gap-2">
                     <span className="text-2xl font-black text-slate-400">{initialConfig.currencySymbol}</span>
                     <input
                        type="text"
                        value={value}
                        readOnly
                        className="w-full bg-transparent text-3xl font-black text-slate-800 outline-none text-center"
                        placeholder="0.00"
                     />
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
                     <button key={n} onClick={() => setValue(prev => (n === '.' && prev.includes('.') ? prev : (prev === '0' && n !== '.' ? n.toString() : prev + n)))} className="h-14 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-xl font-black text-slate-700 active:scale-95 transition-all">{n}</button>
                  ))}
                  <button onClick={() => setValue(prev => prev.slice(0, -1))} className="h-14 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-xl font-black text-slate-700 active:scale-95 transition-all text-sm uppercase">Del</button>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={onClose} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={onConfirm} className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2">
                     <Check size={16} /> Confirm
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
};

const OrderTypeChoiceModal = ({ isOpen, onClose, onSelect, initialConfig }) => {
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (!isOpen) return;
         if (e.key === 'F10') { e.preventDefault(); onSelect('DI'); }
         if (e.key === 'F11') { e.preventDefault(); onSelect('TA'); }
         if (e.key === 'F12') { e.preventDefault(); onSelect('DE'); }
         if (e.key === 'Escape') { onClose(); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onSelect, onClose]);

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[550] flex items-center justify-center p-4">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
         <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 p-8 text-center">

            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Select Order Type</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-8">Confirm or change how this order will be processed</p>

            <div className="grid grid-cols-3 gap-1 mb-2">
               {[
                  { id: 'DI', label: 'Dine In', key: 'F10', icon: <Armchair size={20} />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
                  { id: 'TA', label: 'Take Away', key: 'F11', icon: <ShoppingBag size={20} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { id: 'DE', label: 'Delivery', key: 'F12', icon: <Bike size={20} />, color: 'bg-blue-50 text-blue-600 border-blue-100' }
               ].map(type => (
                  <button
                     key={type.id}
                     onClick={() => onSelect(type.id)}
                     className={`w-full h-30 rounded-2xl border-2 flex items-center justify-between px-6 transition-all hover:scale-[1.02] active:scale-95 ${type.color}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                           {type.icon}
                        </div>
                        <div className="text-left">
                           <span className="block text-sm font-black uppercase tracking-tight">{type.label}</span>
                           <div className="px-3 py-1 bg-white/50 rounded-lg text-[10px] text-center font-black tracking-widest border border-current border-opacity-20 shadow-sm">
                              {type.key}
                           </div>
                        </div>
                     </div>

                  </button>
               ))}
            </div>

            <button
               onClick={onClose}
               className="w-full py-4 rounded-2xl border-2 border-slate-100 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
            >
               Discard
            </button>
         </motion.div>
      </div>
   );
};

export default KotPage;
