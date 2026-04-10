const DB_NAME = 'KotAppDB';
const DB_VERSION = 7; // Schema V7: Ensures all stores like 'bookings' are created

// Existing Stores
export const ADDONS_STORE = 'addons';
export const PRODUCTS_STORE = 'products';
export const ITEM_ADDON_LINKS_STORE = 'item_addon_links';

// New Master Data Stores
export const CUSTOMERS_STORE = 'customers';
export const DELIVERY_AGENTS_STORE = 'deliveryAgents';
export const USERS_STORE = 'users';
export const AUTH_USERS_STORE = 'authUsers';
export const WAITERS_STORE = 'waiters';
export const ORGANIZERS_STORE = 'organizers';
export const GROUPS_STORE = 'groups';
export const UNITS_STORE = 'units';
export const ITEMS_STORE = 'items';
export const FLOORS_STORE = 'floors';
export const TABLES_STORE = 'tables';
export const COOKING_INSTRUCTIONS_STORE = 'cookingInstructions';
export const LEDGERS_STORE = 'ledgers';
export const PAYMENT_METHODS_STORE = 'paymentMethods';
export const MULTI_PAY_TYPES_STORE = 'multiPayTypes';
export const OFFERS_STORE = 'offers';

// Transaction Stores
export const ORDERS_STORE = 'orders';
export const ORDER_ITEMS_STORE = 'orderItems';
export const ORDER_ITEM_ADDONS_STORE = 'orderItemAddons'; // NEW
export const BOOKINGS_STORE = 'bookings'; // NEW

// Meta Store for tracking initialization
export const APP_META_STORE = 'appMeta';

const STORES = [
    { name: ADDONS_STORE, options: { keyPath: 'id', autoIncrement: true } },
    { name: PRODUCTS_STORE, options: { keyPath: 'id', autoIncrement: true } },
    { name: ITEM_ADDON_LINKS_STORE, options: { keyPath: 'itemId' } },

    // Master data (using their id from meta_data.js)
    { name: CUSTOMERS_STORE, options: { keyPath: 'id' } },
    { name: DELIVERY_AGENTS_STORE, options: { keyPath: 'id' } },
    { name: USERS_STORE, options: { keyPath: 'id' } },
    { name: AUTH_USERS_STORE, options: { keyPath: 'id' } },
    { name: WAITERS_STORE, options: { keyPath: 'id' } },
    { name: ORGANIZERS_STORE, options: { keyPath: 'id' } },
    { name: GROUPS_STORE, options: { keyPath: 'id' } },
    { name: UNITS_STORE, options: { keyPath: 'id' } },
    { name: ITEMS_STORE, options: { keyPath: 'id' } },
    { name: FLOORS_STORE, options: { keyPath: 'id' } },
    { name: TABLES_STORE, options: { keyPath: 'id' } },
    { name: COOKING_INSTRUCTIONS_STORE, options: { keyPath: 'id' } },

    { name: LEDGERS_STORE, options: { keyPath: 'id' } },
    { name: PAYMENT_METHODS_STORE, options: { keyPath: 'id' } },
    { name: MULTI_PAY_TYPES_STORE, options: { keyPath: 'id' } },
    { name: OFFERS_STORE, options: { keyPath: 'id' } },

    // Transactions
    { name: ORDERS_STORE, options: { keyPath: 'id' } },
    { name: ORDER_ITEMS_STORE, options: { keyPath: 'id' } },
    { name: ORDER_ITEM_ADDONS_STORE, options: { keyPath: 'id' } }, // NEW
    { name: BOOKINGS_STORE, options: { keyPath: 'id' } }, // NEW

    // Meta Tracking
    { name: APP_META_STORE, options: { keyPath: 'key' } },
];

export const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Radical schema upgrade from older versions required dropping old stores
            if (event.oldVersion < 5) {
                Array.from(db.objectStoreNames).forEach(storeName => {
                    db.deleteObjectStore(storeName);
                });
            }

            STORES.forEach(storeConfig => {
                if (!db.objectStoreNames.contains(storeConfig.name)) {
                    db.createObjectStore(storeConfig.name, storeConfig.options);
                }
            });
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

// Generic IDB Operations
export const getAllFromStore = async (storeName) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveToStore = async (storeName, data) => {
    console.log(storeName, data);
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteFromStore = async (storeName, id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const clearStore = async (storeName) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Backwards compatibility aliases for existing code
export const saveAddon = (addon) => saveToStore(ADDONS_STORE, addon);
export const getAllAddons = () => getAllFromStore(ADDONS_STORE);
export const deleteAddon = (id) => deleteFromStore(ADDONS_STORE, id);

export const saveProduct = (product) => saveToStore(PRODUCTS_STORE, product);
export const getAllProducts = () => getAllFromStore(PRODUCTS_STORE);
export const deleteProduct = (id) => deleteFromStore(PRODUCTS_STORE, id);

export const saveItemAddonLink = (link) => saveToStore(ITEM_ADDON_LINKS_STORE, link);
export const getAllItemAddonLinks = () => getAllFromStore(ITEM_ADDON_LINKS_STORE);
export const deleteItemAddonLink = (id) => deleteFromStore(ITEM_ADDON_LINKS_STORE, id);

// ==========================================
// CORE TRANSACTION ENGINE HELPERS
// ==========================================

export const getOrderByTable = async (tableId) => {
    const orders = await getAllFromStore(ORDERS_STORE);
    return orders.find(o => o.tableId === tableId && o.status !== 'settled' && o.status !== 'cancelled');
};

export const getActiveOrdersByType = async (type) => {
    const orders = await getAllFromStore(ORDERS_STORE);
    return orders.filter(o => o.type === type && o.status !== 'settled' && o.status !== 'cancelled');
};

export const getOrderById = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([ORDERS_STORE], 'readonly');
        const req = tx.objectStore(ORDERS_STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const getOrderItems = async (orderId) => {
    const items = await getAllFromStore(ORDER_ITEMS_STORE);
    return items.filter(i => i.orderId === orderId);
};

export const getCustomerById = async (id) => {
    if (!id) return null;
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction([CUSTOMERS_STORE], 'readonly');
        const req = tx.objectStore(CUSTOMERS_STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
};

export const saveCustomer = async (customer) => {
    return await saveToStore(CUSTOMERS_STORE, customer);
};

export const getAllCustomers = async () => {
    return await getAllFromStore(CUSTOMERS_STORE);
};

export const getCustomerByMobile = async (mobile) => {
    if (!mobile) return null;
    const customers = await getAllFromStore(CUSTOMERS_STORE);
    return customers.find(c => c.mobile === mobile);
};

export const getOrderItemAddons = async (orderItemId) => {
    const addons = await getAllFromStore(ORDER_ITEM_ADDONS_STORE);
    return addons.filter(a => a.orderItemId === orderItemId);
};

export const upsertOrder = async (orderData) => {
    return await saveToStore(ORDERS_STORE, orderData);
};

export const updateOrderStatus = async (orderId, newStatus) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([ORDERS_STORE], 'readwrite');
        const store = tx.objectStore(ORDERS_STORE);
        const req = store.get(orderId);
        req.onsuccess = () => {
            if (req.result) {
                req.result.status = newStatus;
                store.put(req.result).onsuccess = () => resolve();
            } else {
                resolve();
            }
        };
        req.onerror = () => reject(req.error);
    });
};

export const generateKotNo = async (orderType) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([APP_META_STORE], 'readwrite');
        const store = tx.objectStore(APP_META_STORE);
        const sequenceKey = `kot_sequence_${orderType || 'GENERAL'}`;
        const req = store.get(sequenceKey);

        req.onsuccess = () => {
            let nextKot = 1;
            if (req.result) {
                nextKot = (req.result.value || 0) + 1;
            }
            store.put({ key: sequenceKey, value: nextKot }).onsuccess = () => resolve(nextKot);
        };
        req.onerror = () => reject(req.error);
    });
};

export const getSoldOutTracking = async () => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction([APP_META_STORE], 'readonly');
        const req = tx.objectStore(APP_META_STORE).get('sold_out_items');
        req.onsuccess = () => resolve(req.result ? req.result.value : []);
        req.onerror = () => resolve([]);
    });
};

export const decrementTrackedItemQuants = async (cartItems) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([APP_META_STORE], 'readwrite');
        const store = tx.objectStore(APP_META_STORE);
        const req = store.get('sold_out_items');

        req.onsuccess = () => {
            if (req.result && req.result.value) {
                let updated = false;
                const tracked = req.result.value;
                for (let c of cartItems) {
                    const ti = tracked.find(t => t.id === c.id);
                    if (ti && !ti.isSoldOut && ti.qty > 0) {
                        ti.qty -= c.qty;
                        if (ti.qty <= 0) { ti.qty = 0; ti.isSoldOut = true; }
                        updated = true;
                    }
                }
                if (updated) {
                    store.put({ key: 'sold_out_items', value: tracked }).onsuccess = () => resolve();
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        };
        req.onerror = () => reject(req.error);
    });
};

export const saveBooking = (booking) => saveToStore(BOOKINGS_STORE, booking);
export const getAllBookings = () => getAllFromStore(BOOKINGS_STORE);
export const deleteBooking = (id) => deleteFromStore(BOOKINGS_STORE, id);
export const getBookingById = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([BOOKINGS_STORE], 'readonly');
        const req = tx.objectStore(BOOKINGS_STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const updateBookingStatus = async (bookingId, newStatus) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([BOOKINGS_STORE], 'readwrite');
        const store = tx.objectStore(BOOKINGS_STORE);
        const req = store.get(bookingId);
        req.onsuccess = () => {
            if (req.result) {
                req.result.status = newStatus;
                store.put(req.result).onsuccess = () => resolve();
            } else {
                resolve();
            }
        };
        req.onerror = () => reject(req.error);
    });
};

export const clearAllData = async () => {
    const db = await openDB();
    const objectStoreNames = Array.from(db.objectStoreNames);
    if (objectStoreNames.length === 0) return;
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction(objectStoreNames, 'readwrite');
        objectStoreNames.forEach(name => {
            tx.objectStore(name).clear();
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
