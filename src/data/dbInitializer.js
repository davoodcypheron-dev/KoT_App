import { 
    openDB, saveToStore, getAllFromStore, clearStore,
    APP_META_STORE, CUSTOMERS_STORE, DELIVERY_AGENTS_STORE, USERS_STORE, 
    AUTH_USERS_STORE, WAITERS_STORE, ORGANIZERS_STORE, GROUPS_STORE, 
    UNITS_STORE, ITEMS_STORE, FLOORS_STORE, TABLES_STORE, 
    COOKING_INSTRUCTIONS_STORE, LEDGERS_STORE, PAYMENT_METHODS_STORE, 
    MULTI_PAY_TYPES_STORE, OFFERS_STORE, ORDERS_STORE, ORDER_ITEMS_STORE
} from './idb';

import * as MetaData from './meta_data';
import * as MockDbSetters from './mockDb';

const DEFAULT_STORES_TO_SEED = [
    { storeName: CUSTOMERS_STORE, dataSet: MetaData.customersDb },
    { storeName: DELIVERY_AGENTS_STORE, dataSet: MetaData.deliveryAgentsDb },
    { storeName: USERS_STORE, dataSet: MetaData.usersDb },
    { storeName: AUTH_USERS_STORE, dataSet: MetaData.authUsersDb },
    { storeName: WAITERS_STORE, dataSet: MetaData.waitersDb },
    { storeName: ORGANIZERS_STORE, dataSet: MetaData.organizersDb },
    { storeName: GROUPS_STORE, dataSet: MetaData.groupsDb },
    { storeName: UNITS_STORE, dataSet: MetaData.unitsDb },
    { storeName: ITEMS_STORE, dataSet: MetaData.itemsDb },
    { storeName: FLOORS_STORE, dataSet: MetaData.floorsDb },
    { storeName: TABLES_STORE, dataSet: MetaData.tablesDb },
    { storeName: LEDGERS_STORE, dataSet: MetaData.ledgersDb },
    { storeName: PAYMENT_METHODS_STORE, dataSet: MetaData.paymentMethodsDb },
    { storeName: MULTI_PAY_TYPES_STORE, dataSet: MetaData.multiPayTypesDb },
    { storeName: OFFERS_STORE, dataSet: MetaData.offersDb },
    { storeName: COOKING_INSTRUCTIONS_STORE, dataSet: MetaData.cookingInstructionsDb }
];

export const initAppDb = async (forceReset = false) => {
    await openDB(); // Ensure DB schemas exist
    
    let isInitialized = false;
    try {
        const meta = await getAllFromStore(APP_META_STORE);
        if (meta.find(m => m.key === 'initialized')) {
            isInitialized = true;
        }
    } catch (e) {
        console.log("Meta store empty or unreadable");
    }

    if (!isInitialized || forceReset) {
        console.log("Seeding Database from meta_data.js...");

        // Clear all stores to ensure clean state
        const allStores = [
            ...DEFAULT_STORES_TO_SEED.map(s => s.storeName),
            COOKING_INSTRUCTIONS_STORE, ORDERS_STORE, ORDER_ITEMS_STORE, APP_META_STORE
        ];
        
        for (let store of allStores) {
            await clearStore(store);
        }

        // Seed default object arrays with ID properties
        for (let { storeName, dataSet } of DEFAULT_STORES_TO_SEED) {
            for (let item of dataSet) {
                await saveToStore(storeName, item);
            }
        }

        // Mark as initialized
        await saveToStore(APP_META_STORE, { key: 'initialized', value: true });
        console.log("Database initialized successfully!");
    }

    // Now Load Everything from IDB into Memory (mockDb.js variables)
    await loadDbIntoMemoryCache();
};

export const loadDbIntoMemoryCache = async () => {
    console.log("Loading IDB data into Memory Cache...");
    
    MockDbSetters.setCustomersDb(await getAllFromStore(CUSTOMERS_STORE));
    MockDbSetters.setDeliveryAgentsDb(await getAllFromStore(DELIVERY_AGENTS_STORE));
    MockDbSetters.setUsersDb(await getAllFromStore(USERS_STORE));
    MockDbSetters.setAuthUsersDb(await getAllFromStore(AUTH_USERS_STORE));
    MockDbSetters.setWaitersDb(await getAllFromStore(WAITERS_STORE));
    MockDbSetters.setOrganizersDb(await getAllFromStore(ORGANIZERS_STORE));
    MockDbSetters.setGroupsDb(await getAllFromStore(GROUPS_STORE));
    MockDbSetters.setUnitsDb(await getAllFromStore(UNITS_STORE));
    MockDbSetters.setItemsDb(await getAllFromStore(ITEMS_STORE));
    MockDbSetters.setFloorsDb(await getAllFromStore(FLOORS_STORE));
    MockDbSetters.setTablesDb(await getAllFromStore(TABLES_STORE));
    MockDbSetters.setCookingInstructionsDb(await getAllFromStore(COOKING_INSTRUCTIONS_STORE));
    MockDbSetters.setLedgersDb(await getAllFromStore(LEDGERS_STORE));
    MockDbSetters.setPaymentMethodsDb(await getAllFromStore(PAYMENT_METHODS_STORE));
    MockDbSetters.setMultiPayTypesDb(await getAllFromStore(MULTI_PAY_TYPES_STORE));
    MockDbSetters.setOffersDb(await getAllFromStore(OFFERS_STORE));
    MockDbSetters.setOrdersDb(await getAllFromStore(ORDERS_STORE));
    MockDbSetters.setOrderItemsDb(await getAllFromStore(ORDER_ITEMS_STORE));
};
