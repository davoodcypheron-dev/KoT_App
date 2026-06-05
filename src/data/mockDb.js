// In-Memory Database Cache Layer
// This file serves as the synchronous data layer for all React components.
// It is heavily populated by dbInitializer.js BEFORE the main App renders.

export let ordersDb = [];
export const setOrdersDb = (data) => { ordersDb = data; };

export let orderItemsDb = [];
export const setOrderItemsDb = (data) => { orderItemsDb = data; };

export let customersDb = [];
export const setCustomersDb = (data) => { customersDb = data; };

export let deliveryAgentsDb = [];
export const setDeliveryAgentsDb = (data) => { deliveryAgentsDb = data; };

export let usersDb = [];
export const setUsersDb = (data) => { usersDb = data; };

export let authUsersDb = [];
export const setAuthUsersDb = (data) => { authUsersDb = data; };

export let waitersDb = [];
export const setWaitersDb = (data) => { waitersDb = data; };

export let organizersDb = [];
export const setOrganizersDb = (data) => { organizersDb = data; };

export let groupsDb = [];
export const setGroupsDb = (data) => { groupsDb = data; };

export let unitsDb = [];
export const setUnitsDb = (data) => { unitsDb = data; };

export let itemsDb = [];
export const setItemsDb = (data) => { itemsDb = data; };

export let floorsDb = [];
export const setFloorsDb = (data) => { floorsDb = data; };

export let tablesDb = [];
export const setTablesDb = (data) => { tablesDb = data; };

export let cookingInstructionsDb = [];
export const setCookingInstructionsDb = (data) => { cookingInstructionsDb = data; };

export let ledgersDb = [];
export const setLedgersDb = (data) => { ledgersDb = data; };

export let paymentMethodsDb = [];
export const setPaymentMethodsDb = (data) => { paymentMethodsDb = data; };

export let multiPayTypesDb = [];
export const setMultiPayTypesDb = (data) => { multiPayTypesDb = data; };

export let offersDb = [];
export const setOffersDb = (data) => { offersDb = data; };

const defaultConfig = {
  defaultKotType: 'DI', // DI, TA, DE
  restaurantName: 'Antigravity Kitchen',
  taxRate: 5,
  currencySymbol: '₹',
  cashierDiscountLimit: 10, // 10%
  authDiscountLimit: 50, // 50%
  authDisocuntOnly: false,
  paxMandatory: false,
  waiterMandatory: false,
  activeUserId: null,
  openSearch: true,
  settleByLedger: false,
  enablePostOrderType: false
};

const getStoredConfig = () => {
  const stored = localStorage.getItem('kot_app_config');
  if (!stored || stored === 'undefined' || stored === 'null') return defaultConfig;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return defaultConfig;
    return { ...defaultConfig, ...parsed };
  } catch (e) {
    return defaultConfig;
  }
};

export const initialConfig = getStoredConfig();
export { defaultConfig };