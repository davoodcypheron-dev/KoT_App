import { saveAddon, saveProduct, saveItemAddonLink, saveToStore, ITEMS_STORE, getAllFromStore, APP_META_STORE } from './idb';
import { itemsDb, groupsDb } from './mockDb';

const newBaseItems = [
  { id: 'I51', name: 'MAYONNAISE 80GM', price: 30, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I52', name: 'HUMMUS 80M', price: 30, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I53', name: 'TOMATO KETCHUP SACHE', price: 30, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I54', name: 'CHILI FLAKES SACHE', price: 30, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I55', name: 'HERBS SACHE', price: 30, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },

  { id: 'I59', name: 'APPAM – BREAK FAST COMBO', price: 150, groupId: 'G4', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I60', name: 'APPAM', price: 12, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I61', name: 'EGG CURRY', price: 40, groupId: 'G5', dietType: 'egg', unitId: 'U1', openItem: false },
  { id: 'I62', name: 'KADALA CURRY', price: 40, groupId: 'G5', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I63', name: 'GREEN PIECE CURRY', price: 40, groupId: 'G5', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I64', name: 'VEG KURMA', price: 40, groupId: 'G5', dietType: 'veg', unitId: 'U1', openItem: false },

  { id: 'I65', name: 'AL-FAHAM COMBO', price: 250, groupId: 'G9', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I66', name: 'AL-FAHAM – QTR', price: 130, groupId: 'G9', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I67', name: 'AL-FAHAM – HALF', price: 260, groupId: 'G9', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I68', name: 'AL-FAHAM – FULL', price: 520, groupId: 'G9', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I69', name: 'KUBOOS', price: 18, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false },

  { id: 'I70', name: 'PEPSI 300ML', price: 35, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I71', name: 'COCACOLA 300ML', price: 35, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I72', name: '7UP 300ML', price: 35, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false },

  { id: 'I73', name: 'CHEESY CHICKEN PIZZA COMBO', price: 400, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I74', name: 'CHEESY CHICKEN PIZZA REGULAR', price: 330, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I75', name: 'CHEESY CHICKEN PIZZA MEDIUM', price: 745, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I76', name: 'CHEESY CHICKEN PIZZA LARGE', price: 908, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },

  { id: 'I77', name: 'PINEAPPLES 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I78', name: 'JALAPENOS 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I79', name: 'FRESH TOMATOES 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I80', name: 'MUSHROOM 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I81', name: 'SWEET CORNS 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I82', name: 'RED PAPRIKA 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I83', name: 'OLIVES 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I84', name: 'PANEER 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I85', name: 'CAPSICUM 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },
  { id: 'I86', name: 'ONIONS 100GM', price: 40, groupId: 'G1', dietType: 'veg', unitId: 'U1', openItem: false },

  { id: 'I87', name: 'MUTTON KEEMA 100GM', price: 40, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I88', name: 'SMOKED CHICKEN 100GM', price: 40, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I89', name: 'CHICKEN SEEKH 100GM', price: 40, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I90', name: 'BBQ CHICKEN 100GM', price: 40, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false },
  { id: 'I91', name: 'CHICKEN TIKKA 100GM', price: 40, groupId: 'G2', dietType: 'non-veg', unitId: 'U1', openItem: false }
];

export const seedAddonsAndCombos = async () => {
  try {
    const meta = await getAllFromStore(APP_META_STORE);
    if (meta.find(m => m.key === 'addons_combos_seeded_v2')) {
      console.log("Addons and Combos already seeded.");
      return;
    }

    console.log("Seeding new groups...");
    if (!groupsDb.find(g => g.id === 'G9')) {
      groupsDb.push({ id: 'G9', name: 'ARABIC ITEMS' });
      await saveToStore('groups', { id: 'G9', name: 'ARABIC ITEMS' });
    }

    console.log("Seeding new base items...");
    // 1. Insert new items to ITEMS_STORE and mockDb
    for (let item of newBaseItems) {
      await saveToStore(ITEMS_STORE, item);
      if (!itemsDb.find(i => i.id === item.id)) {
        itemsDb.push(item);
      }
    }

    const findItem = (name) => {
      return itemsDb.find(i => i.name === name) || newBaseItems.find(i => i.name === name);
    };

    // 2. Insert Addons
    console.log("Seeding Addons...");
    const addonsData = [
      { base_item: "MAYONNAISE 80GM", display_name: "Mayonnaise", rate: 30 },
      { base_item: "HUMMUS 80M", display_name: "Hummus", rate: 30 },
      { base_item: "TOMATO KETCHUP SACHE", display_name: "Tomato Ketchup", rate: 30 },
      { base_item: "CHILI FLAKES SACHE", display_name: "Chili Flakes", rate: 30 },
      { base_item: "HERBS SACHE", display_name: "Herbs", rate: 30 }
    ];

    const savedAddons = [];
    for (let idx = 0; idx < addonsData.length; idx++) {
      const ad = addonsData[idx];
      const baseItem = findItem(ad.base_item);
      const addon = {
        id: `ADDON_${idx + 1}`,
        itemId: baseItem?.id || '',
        itemName: baseItem?.name || ad.base_item,
        displayName: ad.display_name,
        price: ad.rate,
        status: 'Active',
        branch: 'Antigravity Kitchen',
        createdAt: new Date().toISOString()
      };
      await saveAddon(addon);
      savedAddons.push(addon);
    }

    const getAddonByDisplayName = (name) => savedAddons.find(a => a.displayName === name);

    // 3. Products
    console.log("Seeding Combo Products...");
    const combosData = [
      {
        combo_name: "Appam-Breakfast Combo",
        base_item: "APPAM – BREAK FAST COMBO",
        groups: [
          {
            group_name: "Bread",
            properties: { min: 1, max: 1, type: "FIXED" },
            group_items: [
              { base_item: "APPAM", display_name: "Appam", rate: 12, properties: { min: 1, max: 4, default: 3 } }
            ]
          },
          {
            group_name: "Curry",
            properties: { min: 1, max: 1, type: "CHOICE" },
            group_items: [
              { base_item: "EGG CURRY", display_name: "Egg", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "KADALA CURRY", display_name: "Kadala", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "GREEN PIECE CURRY", display_name: "Green Piece", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "VEG KURMA", display_name: "Veg Kurma", rate: 40, properties: { min: 1, max: 1, default: 1 } }
            ]
          }
        ],
        addons: []
      },
      {
        combo_name: "Al-Faham Combo",
        base_item: "AL-FAHAM COMBO",
        groups: [
          {
            group_name: "Al-Faham",
            properties: { min: 1, max: 1, type: "CHOICE" },
            group_items: [
              { base_item: "AL-FAHAM – QTR", display_name: "Qtr", rate: 130, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "AL-FAHAM – HALF", display_name: "Half", rate: 260, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "AL-FAHAM – FULL", display_name: "Full", rate: 520, properties: { min: 1, max: 1, default: 1 } }
            ]
          },
          {
            group_name: "Bread",
            properties: { min: 1, max: 1, type: "CHOICE" },
            group_items: [
              { base_item: "RUMALI ROTTI", display_name: "Rumali Rotti", rate: 20, properties: { min: 1, max: 5, default: 2 } },
              { base_item: "KUBOOS", display_name: "Kuboos", rate: 18, properties: { min: 1, max: 5, default: 2 } }
            ]
          },
          {
            group_name: "Soft Drink",
            properties: { min: 1, max: 1, type: "CHOICE" },
            group_items: [
              { base_item: "PEPSI 300ML", display_name: "Pepsi 300ml", rate: 35, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "COCACOLA 300ML", display_name: "Cocacola 300ml", rate: 35, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "7UP 300ML", display_name: "7Up 300ml", rate: 35, properties: { min: 1, max: 1, default: 1 } }
            ]
          }
        ],
        addons: ["Mayonnaise", "Hummus", "Tomato Ketchup"]
      },
      {
        combo_name: "Cheesy Chicken Pizza Combo",
        base_item: "CHEESY CHICKEN PIZZA COMBO",
        groups: [
          {
            group_name: "Size",
            properties: { min: 1, max: 1, type: "CHOICE" },
            group_items: [
              { base_item: "CHEESY CHICKEN PIZZA REGULAR", display_name: "Regular (Serves 1, 17cm)", rate: 330, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "CHEESY CHICKEN PIZZA MEDIUM", display_name: "Medium (Serves 2, 25cm)", rate: 745, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "CHEESY CHICKEN PIZZA LARGE", display_name: "Large (Serves 1, 17cm)", rate: 908, properties: { min: 1, max: 1, default: 1 } }
            ]
          },
          {
            group_name: "Toppings - Veg",
            properties: { min: 1, max: 5, type: "CHOICE" },
            group_items: [
              { base_item: "PINEAPPLES 100GM", display_name: "Pineapples", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "JALAPENOS 100GM", display_name: "Jalapenos", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "FRESH TOMATOES 100GM", display_name: "Fresh Tomatoes", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "MUSHROOM 100GM", display_name: "Mushroom", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "SWEET CORNS 100GM", display_name: "Sweet Corns", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "RED PAPRIKA 100GM", display_name: "Red Paprika", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "OLIVES 100GM", display_name: "Olives", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "PANEER 100GM", display_name: "Paneer", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "CAPSICUM 100GM", display_name: "Capsicum", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "ONIONS 100GM", display_name: "Onions", rate: 40, properties: { min: 1, max: 1, default: 1 } }
            ]
          },
          {
            group_name: "Toppings - Non-Veg",
            properties: { min: 1, max: 5, type: "CHOICE" },
            group_items: [
              { base_item: "MUTTON KEEMA 100GM", display_name: "Mutton Keema", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "SMOKED CHICKEN 100GM", display_name: "Smoked Chicken", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "CHICKEN SEEKH 100GM", display_name: "Chicken Seekh", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "BBQ CHICKEN 100GM", display_name: "BBQ Chicken", rate: 40, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "CHICKEN TIKKA 100GM", display_name: "Chicken Tikka", rate: 40, properties: { min: 1, max: 1, default: 1 } }
            ]
          },
          {
            group_name: "Soft Drink",
            properties: { min: 1, max: 1, type: "CHOICE" },
            group_items: [
              { base_item: "PEPSI 300ML", display_name: "Pepsi 300ml", rate: 35, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "COCACOLA 300ML", display_name: "Cocacola 300ml", rate: 35, properties: { min: 1, max: 1, default: 1 } },
              { base_item: "7UP 300ML", display_name: "7Up 300ml", rate: 35, properties: { min: 1, max: 1, default: 1 } }
            ]
          }
        ],
        addons: ["Chili Flakes", "Herbs", "Tomato Ketchup"]
      }
    ];

    for (let idx = 0; idx < combosData.length; idx++) {
      const cd = combosData[idx];
      const baseItem = findItem(cd.base_item);

      const product = {
        id: `COMBO_P${idx + 1}`,
        type: 'COMBO_ITEM',
        baseItemId: baseItem?.id || '',
        baseItemName: baseItem?.name || cd.base_item,
        displayName: cd.combo_name,
        image: null,
        branch: 'Antigravity Kitchen',
        status: 'Active',
        optionGroups: cd.groups.map((g, gIdx) => ({
          id: `G_${idx}_${gIdx}`,
          title: g.group_name,
          type: g.properties.type === "fixed" ? "FIXED" : g.properties.type === "choice" ? "CHOICE" : g.properties.type,
          minSel: g.properties.min,
          maxSel: g.properties.max,
          items: g.group_items.map((gi, giIdx) => {
            const bi = findItem(gi.base_item);
            return {
              id: `GI_${idx}_${gIdx}_${giIdx}`,
              itemId: bi?.id || '',
              itemName: bi?.name || gi.base_item,
              displayName: gi.display_name,
              price: gi.rate,
              qty: gi.properties.default,
              minQty: gi.properties.min,
              maxQty: gi.properties.max
            };
          })
        })),
        addons: cd.addons.map(an => getAddonByDisplayName(an)).filter(Boolean),
        createdAt: new Date().toISOString()
      };

      await saveProduct(product);
    }


    await saveToStore(APP_META_STORE, { key: 'addons_combos_seeded_v2', value: true });
    console.log("Successfully seeded addons and combos!");
  } catch (e) {
    console.error("Error seeding addons and combos:", e);
  }
};
