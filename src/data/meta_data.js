export const customersDb = [
    { id: 'C1', name: 'John Doe', mobile: '9876543210', address: 'Apartment 101, Blue Tower', regNo: 'REG001' },
    { id: 'C2', name: 'Sarah Smith', mobile: '8877665544', address: 'Villa 5, Green Street', regNo: 'REG002' },
    { id: 'C3', name: 'Mike Johnson', mobile: '7766554433', address: 'Downtown 22', regNo: 'REG003' },
    { id: 'C4', name: 'Emily Davis', mobile: '9944332211', address: 'Skyline Apt 4B', regNo: 'REG004' },
    { id: 'C5', name: 'Robert Wilson', mobile: '9812345678', address: 'Maple Road 15', regNo: 'REG005' },
    { id: 'C6', name: 'Jessica Brown', mobile: '9744556677', address: 'Orchid Residency 102', regNo: 'REG006' },
    { id: 'C7', name: 'David Miller', mobile: '9633221100', address: 'River Side Villa 2', regNo: 'REG007' },
    { id: 'C8', name: 'Lisa Taylor', mobile: '9522114433', address: 'Central Park View 7', regNo: 'REG008' },
    { id: 'C9', name: 'Kevin Anderson', mobile: '9411223344', address: 'The Meadows 55', regNo: 'REG009' },
    { id: 'C10', name: 'Sophia Martinez', mobile: '9300112233', address: 'Sunset Boulevard 12', regNo: 'REG010' }
];

export const deliveryAgentsDb = [
    { id: 'DA1', name: 'Anil Das', mobile: '9857556252', vahanNo: 'KL-01-AB-1234' },
    { id: 'DA2', name: 'Arjun Singh', mobile: '9845122334', vahanNo: 'KL-01-CD-5678' },
    { id: 'DA3', name: 'Rahul Varma', mobile: '9212334455', vahanNo: 'KL-01-EF-9012' },
    { id: 'DA4', name: 'Sunil Kumar', mobile: '9988776655', vahanNo: 'KL-01-GH-3456' },
    { id: 'DA5', name: 'Rider Alpha', mobile: '9000011111', vahanNo: 'MOCK-01' },
    { id: 'DA6', name: 'Rider Beta', mobile: '9000022222', vahanNo: 'MOCK-02' },
    { id: 'DA7', name: 'Speedy Delivery', mobile: '9000033333', vahanNo: 'MOCK-03' },
    { id: 'DA8', name: 'Zomato Agent', mobile: '9000044444', vahanNo: 'ONLINE' },
    { id: 'DA9', name: 'Swiggy Agent', mobile: '9000055555', vahanNo: 'ONLINE' }
];

export const usersDb = [
    { id: 'U1', user: 'Admin', pass: '1234', role: 'Admin', kotRateEditable: true, allowOpenItemSettle: true, waiterId: null },
    { id: 'U2', user: 'Manager', pass: 'pass', role: 'Manager', kotRateEditable: true, allowOpenItemSettle: true, waiterId: null },
    { id: 'U3', user: 'Chasier', pass: '1234', role: 'User', kotRateEditable: false, allowOpenItemSettle: true, waiterId: 'WT13' },
    { id: 'U4', user: 'User', pass: 'user', role: 'User', kotRateEditable: false, allowOpenItemSettle: false, waiterId: null },
];

export const authUsersDb = [
    { id: 'U1', cancelKot: false },
    { id: 'U2', cancelKot: true }];

export const waitersDb = [
    { id: 'WT1', name: 'Anil Das', pass: '1234', isAllowedKotCancel: false },
    { id: 'WT2', name: 'Sanjay Kumar', pass: '1111', isAllowedKotCancel: false },
    { id: 'WT3', name: 'Rahul Sharma', pass: '2222', isAllowedKotCancel: false },
    { id: 'WT4', name: 'Vikram Singh', pass: '3333', isAllowedKotCancel: false },
    { id: 'WT5', name: 'Prakash Raj', pass: '4444', isAllowedKotCancel: true },
    { id: 'WT6', name: 'Amit Verma', pass: '5555', isAllowedKotCancel: true },
    { id: 'WT7', name: 'Suresh Raina', isAllowedKotCancel: true },
    { id: 'WT8', name: 'Deepak Chahar', isAllowedKotCancel: false },
    { id: 'WT9', name: 'Rohit Sharma', isAllowedKotCancel: true },
    { id: 'WT10', name: 'Virat Kohli', isAllowedKotCancel: true },
    { id: 'WT11', name: 'MS Dhoni', isAllowedKotCancel: true },
    { id: 'WT12', name: 'KL Rahul', isAllowedKotCancel: false },
    { id: 'WT13', name: 'Cashier', isAllowedKotCancel: false },
];

export const organizersDb = [
    { id: 'O1', name: "TODAY'S SPECIALS", items: ['I1', 'I5', 'I6', 'I7'] },
    { id: 'O2', name: 'FAST MOVING', items: ['I9', 'I10', 'I1', 'I3'] },
    { id: 'O3', name: 'BREAKFAST', items: ['I1', 'I2', 'I8'] },
    { id: 'O4', name: 'CHEF RECOMMENDATION', items: ['I6', 'I7', 'I4'] }
];

export const groupsDb = [
    { id: 'G1', name: 'STARTERS (VEG)' },
    { id: 'G2', name: 'STARTERS (NON-VEG)' },
    { id: 'G3', name: 'INDIAN BREADS' },
    { id: 'G4', name: 'RICE & BIRYANI' },
    { id: 'G5', name: 'CURRIES' },
    { id: 'G6', name: 'HOT BEVERAGES' },
    { id: 'G7', name: 'COLD BEVERAGES' },
    { id: 'G8', name: 'ICE CREAMS' }
];

export const unitsDb = [
    { id: 'U-PCS', name: 'Pieces', decimals: 0 },
    { id: 'U-PLT', name: 'Plate', decimals: 0 },
    { id: 'U-KGS', name: 'Kilograms', decimals: 3 },
    { id: 'U-LTR', name: 'Liters', decimals: 3 },
    { id: 'U-POR', name: 'Portion', decimals: 1 }
];

export const itemsDb = [
    // G1: STARTERS (VEG)
    { id: 'I1', name: 'Paneer Tikka', arName: 'بانير تيكا', price: 250, groupId: 'G1', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400' },
    { id: 'I2', name: 'Veg Spring Rolls', arName: 'سبرينغ رول نباتي', price: 180, groupId: 'G1', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },
    { id: 'I3', name: 'Gobi Manchurian', arName: 'جوبي منشوريان', price: 200, groupId: 'G1', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1625398407796-a1103c800889?w=400' },
    { id: 'I4', name: 'Crispy Corn', arName: 'ذرة مقرمشة', price: 160, groupId: 'G1', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1635352723654-7221376df173?w=400' },
    { id: 'I5', name: 'Hara Bhara Kabab', arName: 'هارا بهارا كباب', price: 190, groupId: 'G1', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1626777553732-48995abb358c?w=400' },
    { id: 'I6', name: 'Mushroom Duplex', arName: 'مشروم دوبلكس', price: 220, groupId: 'G1', dietType: 'veg', unitId: 'U2', openItem: true, image: 'https://images.unsplash.com/photo-1512132411229-c30391241dd8?w=400' },

    // G2: STARTERS (NON-VEG)
    { id: 'I7', name: 'Chicken 65', arName: 'دجاج 65', price: 280, groupId: 'G2', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400' },
    { id: 'I8', name: 'Fish Tikka', arName: 'تيكا السمك', price: 350, groupId: 'G2', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400' },
    { id: 'I9', name: 'Mutton Seekh Kebab', arName: 'كباب لحم الضأن', price: 400, groupId: 'G2', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400' },
    { id: 'I10', name: 'Chicken Lollipop', arName: 'لوليبوب دجاج', price: 310, groupId: 'G2', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400' },
    { id: 'I11', name: 'Prawns Tempura', arName: 'روبيان تمبورا', price: 450, groupId: 'G2', dietType: 'non-veg', unitId: 'U2', openItem: true, image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4520b?w=400' },
    { id: 'I12', name: 'Egg Bonda', arName: 'بوندا البيض', price: 120, groupId: 'G2', dietType: 'egg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' },

    // G3: INDIAN BREADS
    { id: 'I13', name: 'Butter Naan', arName: 'خبز نان بالزبدة', price: 60, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1601050690597-df0568a70950?w=400' },
    { id: 'I14', name: 'Garlic Naan', arName: 'نان بالثوم', price: 75, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
    { id: 'I15', name: 'Tandoori Roti', arName: 'تندوري روتي', price: 30, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400' },
    { id: 'I16', name: 'Rumali Roti', arName: 'رومالي روتي', price: 50, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1616070829624-88405ad4932a?w=400' },
    { id: 'I17', name: 'Laccha Paratha', arName: 'لاشا باراثا', price: 65, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1495147334217-fc1330263392?w=400' },
    { id: 'I18', name: 'Aloo Paratha', arName: 'ألو باراثا', price: 90, groupId: 'G3', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400' },

    // G4: RICE & BIRYANI
    { id: 'I19', name: 'Chicken Biryani', arName: 'برياني دجاج', price: 320, groupId: 'G4', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=400' },
    { id: 'I20', name: 'Mutton Biryani', arName: 'برياني لحم ضأن', price: 450, groupId: 'G4', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400' },
    { id: 'I21', name: 'Veg Pulao', arName: 'بولو خضار', price: 240, groupId: 'G4', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400' },
    { id: 'I22', name: 'Jeera Rice', arName: 'أرز بالكمون', price: 180, groupId: 'G4', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400' },
    { id: 'I23', name: 'Egg Fried Rice', arName: 'أرز مقلي بالبيض', price: 220, groupId: 'G4', dietType: 'egg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400' },
    { id: 'I24', name: 'Hyderabadi Dum Biryani', arName: 'برياني دجاج حيدر أباد', price: 350, groupId: 'G4', dietType: 'non-veg', unitId: 'U2', openItem: true, image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400' },

    // G5: CURRIES
    { id: 'I25', name: 'Butter Chicken', arName: 'دجاج بالزبدة', price: 380, groupId: 'G5', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1603894584134-f174bc89c79d?w=400' },
    { id: 'I26', name: 'Paneer Butter Masala', arName: 'بانير زبدة ماسالا', price: 320, groupId: 'G5', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
    { id: 'I27', name: 'Dal Makhani', arName: 'دال مخاني', price: 240, groupId: 'G5', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1585934189154-117f7530c609?w=400' },
    { id: 'I28', name: 'Mutton Rogan Josh', arName: 'روغان جوش لحم الضأن', price: 480, groupId: 'G5', dietType: 'non-veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400' },
    { id: 'I29', name: 'Kadai Paneer', arName: 'كاداي بانير', price: 300, groupId: 'G5', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1601050690011-855c56d78704?w=400' },
    { id: 'I30', name: 'Mix Veg Curry', arName: 'كاري خضار مشكل', price: 220, groupId: 'G5', dietType: 'veg', unitId: 'U2', openItem: false, image: 'https://images.unsplash.com/photo-1588166524941-3bf61a7c41eb?w=400' },
    { id: 'I31', name: 'Fish Moilee', arName: 'سمك مولي', price: 420, groupId: 'G5', dietType: 'non-veg', unitId: 'U2', openItem: true, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400' },

    // G6: HOT BEVERAGES
    { id: 'I32', name: 'Masala Tea', arName: 'شاي ماسالا', price: 40, groupId: 'G6', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400' },
    { id: 'I33', name: 'Filter Coffee', arName: 'قهوة فلتر', price: 50, groupId: 'G6', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
    { id: 'I34', name: 'Green Tea', arName: 'شاي أخضر', price: 60, groupId: 'G6', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=400' },
    { id: 'I35', name: 'Hot Chocolate', arName: 'شوكولاتة ساخنة', price: 120, groupId: 'G6', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1544787210-221160230663?w=400' },
    { id: 'I36', name: 'Lemon Honey Tea', arName: 'شاي ليمون وعسل', price: 70, groupId: 'G6', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=400' },

    // G7: COLD BEVERAGES
    { id: 'I37', name: 'Fresh Lime Soda', arName: 'صودا ليمون طازجة', price: 80, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
    { id: 'I38', name: 'Mango Shake', arName: 'مخفوق المانجو', price: 150, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: true, image: 'https://images.unsplash.com/photo-1546173159-315724a93c90?w=400' },
    { id: 'I39', name: 'Cold Coffee', arName: 'قهوة باردة', price: 180, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
    { id: 'I40', name: 'Virgin Mojito', arName: 'فيرجن موهيتو', price: 160, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
    { id: 'I41', name: 'Coke 330ml', arName: 'كوكا كولا', price: 45, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { id: 'I42', name: 'Water Bottle 1L', arName: 'زجاجة مياه', price: 30, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1523362628744-4cdd85860a31?w=400' },
    { id: 'I43', name: 'Avocado Smoothie', arName: 'سموذي الأفوكادو', price: 220, groupId: 'G7', dietType: 'veg', unitId: 'U1', openItem: true, image: 'https://images.unsplash.com/photo-1525385133512-2f4963240c73?w=400' },

    // G8: ICE CREAMS
    { id: 'I44', name: 'Vanilla Scoop', arName: 'مغرفة فانيليا', price: 90, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1570197788417-0e93323c98bd?w=400' },
    { id: 'I45', name: 'Chocolate Fudge', arName: 'فدج الشوكولاتة', price: 150, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
    { id: 'I46', name: 'Strawberry Delight', arName: 'بهجة الفراولة', price: 120, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400' },
    { id: 'I47', name: 'Butterscotch', arName: 'بوتيرسكوتش', price: 130, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1505394033343-43adc2f44488?w=400' },
    { id: 'I48', name: 'Kulfi Falooda', arName: 'كولفي فالودة', price: 190, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400' },
    { id: 'I49', name: 'Sizzling Brownie', arName: 'براوني سيزلينج', price: 250, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: false, image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400' },
    { id: 'I50', name: 'Death by Chocolate', arName: 'الموت بالشوكولاتة', price: 280, groupId: 'G8', dietType: 'veg', unitId: 'U1', openItem: true, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400' }
];

export const floorsDb = [
    { id: 'F1', name: 'Ground Floor' },
    { id: 'F2', name: 'Roof Top' }
];

export const tablesDb = [
    // GROUND FLOOR
    { id: 'T1', floor: 'F1', status: 'running' },
    { id: 'T2', floor: 'F1', status: 'vacant' },
    { id: 'T3', floor: 'F1', status: 'vacant' },
    { id: 'T4', floor: 'F1', status: 'saved' },
    { id: 'T5', floor: 'F1', status: 'vacant' },
    { id: 'T6', floor: 'F1', status: 'vacant' },
    { id: 'T7', floor: 'F1', status: 'vacant' },
    { id: 'T8', floor: 'F1', status: 'vacant' },
    { id: 'T9', floor: 'F1', status: 'running' },
    { id: 'T10', floor: 'F1', status: 'vacant' },
    { id: 'T11', floor: 'F1', status: 'vacant' },
    { id: 'T12', floor: 'F1', status: 'vacant' },
    { id: 'T13', floor: 'F1', status: 'running' },
    { id: 'T14', floor: 'F1', status: 'vacant' },
    { id: 'T15', floor: 'F1', status: 'vacant' },
    { id: 'T16', floor: 'F1', status: 'vacant' },
    { id: 'T17', floor: 'F1', status: 'running' },
    { id: 'T18', floor: 'F1', status: 'vacant' },
    { id: 'T19', floor: 'F1', status: 'vacant' },

    // ROOF TOP
    { id: 'RT1', floor: 'F2', status: 'vacant' },
    { id: 'RT2', floor: 'F2', status: 'running' },
    { id: 'RT3', floor: 'F2', status: 'vacant' },
    { id: 'RT4', floor: 'F2', status: 'vacant' },
    { id: 'RT5', floor: 'F2', status: 'vacant' },
    { id: 'RT6', floor: 'F2', status: 'running' },
    { id: 'RT7', floor: 'F2', status: 'vacant' },
    { id: 'RT8', floor: 'F2', status: 'vacant' },
    { id: 'RT9', floor: 'F2', status: 'vacant' }
];

export const cookingInstructionsDb = [
    { id: 'CI1', name: "Less Spicy" },
    { id: 'CI2', name: "More Spicy" },
    { id: 'CI3', name: "No Onion" },
    { id: 'CI4', name: "No Garlic" },
    { id: 'CI5', name: "Extra Cheese" },
    { id: 'CI6', name: "Well Done" },
    { id: 'CI7', name: "Medium Rare" },
    { id: 'CI8', name: "No Sugar" },
    { id: 'CI9', name: "Hot" },
    { id: 'CI10', name: "Parcel" },
    { id: 'CI11', name: "Plastic Cover" }
];

export const ledgersDb = [
    { id: 'L1', name: 'Staff Account' },
    { id: 'L2', name: "Director's Account" },
    { id: 'L3', name: 'Corporate Account - TechPark' },
    { id: 'L4', name: 'Promotional Ledger' },
    { id: 'L5', name: 'Zomato Credit' },
    { id: 'L6', name: 'Swiggy Credit' }
];

export const paymentMethodsDb = [
    { id: 'cash', name: 'CASH', color: 'bg-emerald-500', priority: 1 },
    { id: 'card', name: 'CARD', color: 'bg-blue-500', priority: 2 },
    { id: 'upi', name: 'UPI', color: 'bg-blue-500', priority: 3 },
    { id: 'credit', name: 'CREDIT', color: 'bg-blue-500', priority: 4 },
    { id: 'other', name: 'OTHER', color: 'bg-blue-500', priority: 5 },
    { id: 'compliment', name: 'COMPLIMENT', color: 'bg-pink-500', priority: 6 },
];

export const multiPayTypesDb = [
    { id: 'cash', name: 'CASH', priority: 1 },
    { id: 'card', name: 'CARD', priority: 2 },
    { id: 'upi', name: 'UPI', priority: 3 },
    { id: 'credit', name: 'CREDIT', priority: 4 },
    { id: 'bank', name: 'BANK', priority: 5 },
    { id: 'coupon', name: 'COUPON', priority: 6 },
];


export const offersDb = [
    {
        id: 'OFF_001',
        name: 'BOGO Starters - Happy Hours',
        type: 'FREE_ITEM',
        buyItemId: 'I1',
        freeItemId: 'I1',
        buyQty: 1,
        freeQty: 1,
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        startTime: '16:00',
        endTime: '19:00',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_002',
        name: 'Midweek Paneer Discount',
        type: 'ITEM_DISCOUNT_PERCENT',
        targetItemId: 'I1',
        discountValue: 15,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        validDays: ['Wednesday'],
        startTime: '00:00',
        endTime: '23:59',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_003',
        name: 'Late Night Dessert Treat',
        type: 'BILL_AMOUNT_FREE_ITEM',
        minBillAmount: 1500,
        freeItemId: 'I49',
        freeQty: 1,
        startDate: '2026-03-15',
        endDate: '2026-04-15',
        validDays: ['Friday', 'Saturday', 'Sunday'],
        startTime: '22:00',
        endTime: '23:59',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_004',
        name: 'Weekend Family Flat Off',
        type: 'BILL_AMOUNT_FLAT_DISCOUNT',
        minBillAmount: 2500,
        discountValue: 300,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        validDays: ['Saturday', 'Sunday'],
        startTime: '12:00',
        endTime: '16:00',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_005',
        name: 'Lunch Special Combo Price',
        type: 'BILL_AMOUNT_SPECIAL_PRICE',
        minBillAmount: 800,
        specialPriceValue: 699,
        startDate: '2026-02-01',
        endDate: '2026-05-31',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '12:00',
        endTime: '15:30',
        isAuto: false,
        status: 'active'
    },
    {
        id: 'OFF_006',
        name: 'Morning Coffee Boost',
        type: 'BILL_AMOUNT_DISCOUNT_PERCENT',
        minBillAmount: 300,
        discountValue: 20,
        maxDiscount: 100,
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '08:00',
        endTime: '11:00',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_007',
        name: 'Bulk Soft Drink Offer',
        type: 'ITEM_DISCOUNT_PERCENT',
        targetItemId: 'I41',
        minQty: 6,
        discountValue: 25,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '00:00',
        endTime: '23:59',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_008',
        name: 'Breakfast Combo - Free Tea',
        type: 'FREE_ITEM',
        buyItemId: 'I18',
        freeItemId: 'I32',
        buyQty: 1,
        freeQty: 1,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '07:00',
        endTime: '11:30',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_009',
        name: 'Dinner Rush Discount',
        type: 'BILL_AMOUNT_DISCOUNT_PERCENT',
        minBillAmount: 1800,
        discountValue: 10,
        maxDiscount: 250,
        startDate: '2026-03-01',
        endDate: '2026-08-31',
        validDays: ['Friday', 'Saturday'],
        startTime: '19:00',
        endTime: '22:30',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_010',
        name: 'IPL Special Match Hours',
        type: 'ITEM_DISCOUNT_PERCENT',
        targetItemId: 'I7',
        discountValue: 20,
        startDate: '2026-03-22',
        endDate: '2026-05-25',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '19:30',
        endTime: '23:30',
        isAuto: true,
        status: 'active'
    },
    {
        id: 'OFF_011',
        name: 'EAT 1000 GET 100 OFF',
        type: 'BILL_AMOUNT_FLAT_DISCOUNT',
        minBillAmount: 1000,
        discountValue: 100,
        maxDiscount: 100,
        startDate: '2026-03-01',
        endDate: '2026-08-31',
        validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '00:00',
        endTime: '23:59',
        isAuto: true,
        status: 'active'
    },

];