import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialConfig, defaultConfig, waitersDb, itemsDb, customersDb, tablesDb, deliveryAgentsDb, usersDb } from '../data/mockDb';
import { getOrderByTable, getOrderItems, getAllFromStore, ORDERS_STORE, getCustomerById } from '../data/idb';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('kot_app_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved config", e);
        return initialConfig;
      }
    }
    return initialConfig;
  });

  useEffect(() => {
    console.log('System Configuration Loaded:', config);
  }, []);

  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTableState] = useState(null);
  const [soldOutItems, setSoldOutItems] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [pax, setPax] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deliveryAgent, setDeliveryAgent] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');

  const notify = (msg, type = 'success') => {
    const id = Math.random();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleTableSelection = async (table, paxCount = 1, orderId = null) => {
    let finalTable = table;
    let finalPax = paxCount;
    let finalType = config.defaultKotType;

    let activeOrder;
    if (orderId) {
      const orders = await getAllFromStore(ORDERS_STORE);
      activeOrder = orders.find(o => o.id === orderId);
    }

    if (!activeOrder && table?.id && table?.status !== 'vacant') {
      activeOrder = await getOrderByTable(table.id);
    }

    if (activeOrder) {
      if (activeOrder.tableId) {
        finalTable = tablesDb.find(t => t.id === activeOrder.tableId) || { id: activeOrder.tableId, type: 'DI' };
      }
      finalPax = activeOrder.pax || 1;
      finalType = activeOrder.type;

      setSelectedTableState({ ...finalTable, status: activeOrder.status, orderId: activeOrder.id });
      setPax(finalPax);
      setConfig(prev => ({ ...prev, defaultKotType: finalType }));

      const dbItems = await getOrderItems(activeOrder.id);
      const activeItems = dbItems.filter(oi => oi.status !== 'cancelled');

      const mappedCart = activeItems.map(oi => {
        const itemDetail = itemsDb.find(i => i.id === oi.itemId) || { name: 'Unknown Item' };
        return {
          id: oi.itemId,
          cartId: oi.id,
          name: itemDetail.name,
          price: oi.price,
          qty: oi.qty,
          modifiers: oi.cookingInstructions || [],
          isChoice: oi.isChoice,
          variantId: oi.variantId,
          isCombo: oi.isCombo,
          comboId: oi.comboId,
          isSaved: true,
          isParcel: oi.isParcel,
          createdAt: oi.addedTime,
          kotNo: oi.kotNo,
          sessionTime: oi.addedTime ? new Date(oi.addedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        };
      });
      setCart(mappedCart);

      if (activeOrder.customerId) {
        let customer = customersDb.find(c => c.id === activeOrder.customerId);
        if (!customer) {
          customer = await getCustomerById(activeOrder.customerId);
        }
        setSelectedCustomer(customer || null);
      } else {
        setSelectedCustomer(null);
      }

      if (activeOrder.deliveryAgentId) {
        const agent = deliveryAgentsDb.find(a => a.id === activeOrder.deliveryAgentId);
        if (agent) setDeliveryAgent(agent);
      } else {
        setDeliveryAgent(null);
      }

      setOrderNotes(activeOrder.orderDescription || '');

      if (activeOrder.waiterId) {
        const waiter = waitersDb.find(w => w.id === activeOrder.waiterId);
        if (waiter) setSelectedWaiter(waiter);
      }
    } else {
      // NEW ORDER or ASSIGNING TABLE TO DRAFT
      setSelectedTableState(table);
      setPax(paxCount);

      // Only clear cart if we are not already working on a draft or if explicitly requested
      // In 'Table Selection Later', we keep the cart.
      if (cart.length > 0 && !orderId && table?.status === 'vacant') {
        // Keep existing cart items
      } else if (!orderId) {
        setCart([]);
        setSelectedCustomer(null);
        setDeliveryAgent(null);
        setOrderNotes('');
      }

      if (table?.type) {
        setConfig(prev => ({ ...prev, defaultKotType: table.type }));
      }
    }
  };

  const clearCurrentOrder = () => {
    setCart([]);
    setSelectedTableState(null);
    setSelectedCustomer(null);
    setDeliveryAgent(null);
    setOrderNotes('');
    setPax(1);

    // Reset to default waiter for the logged-in user if exists
    if (config.activeUserId) {
      const user = usersDb.find(u => u.id === config.activeUserId);
      if (user && user.waiterId) {
        const defaultWaiter = waitersDb.find(w => w.id === user.waiterId);
        if (defaultWaiter) {
          setSelectedWaiter(defaultWaiter);
          return;
        }
      }
    }
    setSelectedWaiter(null);
  };

  useEffect(() => {
    localStorage.setItem('kot_app_config', JSON.stringify(config));
  }, [config]);

  return (
    <AppContext.Provider value={{
      config,
      setConfig,
      resetConfig: () => setConfig(defaultConfig),
      cart, setCart,
      selectedTable, setSelectedTable: handleTableSelection,
      soldOutItems, setSoldOutItems,
      notifications, notify,
      waiters: waitersDb, selectedWaiter, setSelectedWaiter,
      pax, setPax,
      selectedCustomer, setSelectedCustomer,
      deliveryAgent, setDeliveryAgent,
      orderNotes, setOrderNotes,
      clearCurrentOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
