// Seeds the demo offers shown on the customer Offers page (design board 04, panel 4).
// Synthetic demo data for the three seeded stores. Offers are display content: order pricing
// does not apply them. Safe to re-run: each offer is upserted by a fixed _id.
//
// Run on the Dell host:
//   docker exec -i masova-mongodb mongosh --quiet < scripts/reseed/seed-store-offers.js
const offers = db.getSiblingDB('masova_commerce').store_offers;
const STORES = [
  { storeId: 'DOM001', name: 'Berlin Mitte', money: amount => `€${amount}` },
  { storeId: 'DOM002', name: 'Munich Schwabing', money: amount => `€${amount}` },
  { storeId: 'DOM003', name: 'London Soho', money: amount => `£${amount}` },
];
const VALID_UNTIL = ISODate('2026-10-31T00:00:00Z');

let seeded = 0;
for (const { storeId, name, money } of STORES) {
  const list = [
    { key: 'indian-classics', badge: '20% OFF', category: 'Indian', title: '20% off Indian classics', description: 'Enjoy 20% off selected Indian mains.', imageUrl: '/images/menu/north-indian-thali.jpg', appliesTo: 'Applies to selected Indian dishes', redemption: 'Shown at checkout' },
    { key: 'pizza-drink', badge: 'Meal deal', category: 'Pizza', title: 'Pizza & drink combo', description: `Any classic pizza + soft drink for ${money(15)}.`, imageUrl: '/images/menu/pepperoni-pizza.jpg', appliesTo: 'Classic pizzas only', redemption: 'Add both items to cart' },
    { key: 'free-delivery', badge: 'Free delivery', category: 'Burgers', title: `Free delivery over ${money(25)}`, description: `Get free delivery on orders over ${money(25)}.`, imageUrl: '/images/menu/classic-cheeseburger.jpg', appliesTo: `${name} only`, redemption: 'Applies automatically at checkout' },
    { key: 'pasta-favourites', badge: '15% OFF', category: 'Pasta', title: '15% off pasta favourites', description: 'Save 15% on all pasta dishes.', imageUrl: '/images/menu/spaghetti-carbonara.jpg', appliesTo: 'Applies to selected pasta dishes', redemption: 'Shown at checkout' },
    { key: 'lunch-salad', badge: 'Lunch special', category: 'Salads', title: 'Healthy lunch deal', description: `Selected salads for ${money('9.50')}.`, imageUrl: '/images/menu/greek-salad.jpg', appliesTo: 'Selected salads only', redemption: 'Available 11:00 – 15:00' },
    { key: 'sweet-finish', badge: 'Dessert deal', category: 'Desserts', title: 'Sweet finish', description: `Add any dessert for ${money(4)} with a main.`, imageUrl: '/images/menu/gulab-jamun.jpg', appliesTo: 'Add a dessert and a main dish', redemption: 'Shown at checkout' },
  ];
  list.forEach(({ key, ...offer }, index) => {
    offers.replaceOne(
      { _id: `demo-${storeId}-${key}` },
      { ...offer, storeId, validUntil: VALID_UNTIL, active: true, sortOrder: NumberInt(index), _class: 'com.MaSoVa.commerce.menu.entity.StoreOffer' },
      { upsert: true },
    );
    seeded += 1;
  });
}
offers.createIndex({ storeId: 1, active: 1, validUntil: 1 });
print(`store offers: ${seeded} demo offers upserted across ${STORES.length} stores`);
