// Demo menu enrichment: allergens, dietary marks, pizza sizes and extras for the seeded dishes.
// Synthetic development data only. Run after seed-commerce.js:
//   docker exec -i masova-mongodb mongosh --quiet < scripts/reseed/enrich-menu-demo.js
// The seed marks every dish "allergens declared" with an empty list, which wrongly reads as
// "contains none". This script fills the list for each seeded dish name. Dishes it does not
// know are set to not declared, so the storefront asks customers to check with the store.

const menu = db.getSiblingDB('masova_commerce').menu_items;
const G = 'CEREALS_GLUTEN', M = 'MILK', E = 'EGGS', N = 'NUTS', S = 'SOYA', F = 'FISH', C = 'CRUSTACEANS',
  MO = 'MOLLUSCS', MU = 'MUSTARD', SE = 'SESAME', SU = 'SULPHUR_DIOXIDE', CE = 'CELERY';
const VEG = 'VEGETARIAN', VGN = 'VEGAN', NV = 'NON_VEGETARIAN', EGG = 'CONTAINS_EGGS';

// name: [allergens, dietaryInfo]
const DISHES = {
  'BBQ Burger': [[G, M, MU, SE], [NV]], 'Classic Cheeseburger': [[G, M, MU, SE], [NV]], 'Crispy Chicken Burger': [[G, M, E, SE], [NV]], 'Veggie Burger': [[G, S, SE], [VEG]],
  'Butter Roti': [[G, M], [VEG]], 'Tandoori Roti': [[G], [VEG, VGN]], 'Missi Roti': [[G], [VEG, VGN]],
  'Cola': [[], [VEG, VGN]], 'Fresh Lemonade': [[], [VEG, VGN]], 'Mango Lassi': [[M], [VEG]], 'Cold Coffee': [[M], [VEG]],
  'San Pellegrino Sparkling Water (750ml)': [[], [VEG, VGN]], 'Acqua Panna Still (750ml)': [[], [VEG, VGN]],
  'Chocolate Brownie': [[G, M, E], [VEG, EGG]], 'Chocolate Chip Cookie': [[G, M, E], [VEG, EGG]], 'Walnut Brownie': [[G, M, E, N], [VEG, EGG]],
  'Paneer Butter Masala': [[M, N], [VEG]], 'Butter Chicken': [[M, N], [NV]], 'Palak Paneer': [[M], [VEG]], 'Chicken Tikka Masala': [[M], [NV]],
  'Dal Tadka': [[], [VEG, VGN]], 'Dal Makhani': [[M], [VEG]], 'Chana Masala': [[], [VEG, VGN]],
  'Tiramisu': [[G, M, E], [VEG, EGG]], 'Gulab Jamun': [[G, M], [VEG]], 'Rasmalai': [[M, N], [VEG]], 'New York Cheesecake': [[G, M, E], [VEG, EGG]],
  'Panna Cotta': [[M], [NV]], 'Apple Strudel': [[G, M, E], [VEG, EGG]], 'Creme Brulee': [[M, E], [VEG, EGG]], 'Baklava': [[G, M, N], [VEG]],
  'Masala Dosa': [[], [VEG, VGN]], 'Plain Dosa': [[], [VEG, VGN]], 'Mysore Masala Dosa': [[], [VEG, VGN]], 'Rava Dosa': [[G], [VEG, VGN]],
  'Veg Fried Rice': [[S], [VEG, VGN]], 'Chicken Fried Rice': [[S, E], [NV]], 'Egg Fried Rice': [[S, E], [VEG, EGG]],
  'Espresso': [[], [VEG, VGN]], 'Cappuccino': [[M], [VEG]], 'Hot Chocolate': [[M], [VEG]],
  'Vanilla Ice Cream': [[M, E], [VEG, EGG]], 'Chocolate Ice Cream': [[M, E], [VEG, EGG]], 'Mango Ice Cream': [[M], [VEG]],
  'Idly Sambar': [[], [VEG, VGN]], 'Medu Vada': [[], [VEG, VGN]], 'Idly Vada Combo': [[], [VEG, VGN]],
  'Gobi Manchurian': [[G, S], [VEG, VGN]], 'Chicken Manchurian': [[G, S, E], [NV]], 'Veg Manchurian': [[G, S], [VEG, VGN]],
  'Butter Naan': [[G, M], [VEG]], 'Garlic Naan': [[G, M], [VEG]], 'Cheese Naan': [[G, M], [VEG]],
  'Veg Hakka Noodles': [[G, S], [VEG, VGN]], 'Chicken Hakka Noodles': [[G, S, E], [NV]], 'Schezwan Noodles': [[G, S], [VEG, VGN]],
  'North Indian Thali': [[G, M], [VEG]], 'Veg Biryani Plate': [[M, N], [VEG]], 'Chicken Biryani Plate': [[M, N], [NV]],
  'Margherita Pizza': [[G, M], [VEG]], 'Pepperoni Pizza': [[G, M], [NV]], 'Quattro Formaggi': [[G, M], [VEG]], 'Veggie Supreme Pizza': [[G, M], [VEG]],
  'Jeera Rice': [[], [VEG, VGN]], 'Steamed Basmati': [[], [VEG, VGN]], 'Coconut Rice': [[], [VEG, VGN]],
  'Garlic Bread': [[G, M], [VEG]], 'French Fries': [[], [VEG, VGN]], 'Caesar Salad': [[G, M, E, F], [NV]], 'Onion Rings': [[G], [VEG, VGN]],
  'Creamy Mushroom Pasta': [[G, M], [VEG]], 'Grilled Beef Steak': [[M], [NV]], 'Spaghetti Carbonara': [[G, M, E], [NV]], 'Lasagna Bolognese': [[G, M, E, CE], [NV]],
  'Mushroom Risotto': [[M, CE], [VEG]], 'Chicken Parmesan': [[G, M, E], [NV]], 'Bruschetta': [[G], [VEG, VGN]], 'Gnocchi Pesto': [[G, M, N], [VEG]],
  'Caprese Salad': [[M], [VEG]], 'Wiener Schnitzel': [[G, E], [NV]], 'Bratwurst Platter': [[MU], [NV]], 'Currywurst': [[MU, CE], [NV]],
  'Soft Pretzel': [[G], [VEG, VGN]], 'German Potato Salad': [[MU], [VEG, VGN]], 'Kaesespaetzle': [[G, M, E], [VEG, EGG]], 'Fish and Chips': [[G, F], [NV]],
  "Shepherd's Pie": [[M, CE], [NV]], 'French Onion Soup': [[G, M], [NV]], 'Quiche Lorraine': [[G, M, E], [NV]], 'Ratatouille': [[], [VEG, VGN]],
  'Croque Monsieur': [[G, M], [NV]], 'Beef Bourguignon': [[SU, CE], [NV]], 'Seafood Paella': [[C, MO, F], [NV]], 'Spanish Tortilla': [[E], [VEG, EGG]],
  'Patatas Bravas': [[], [VEG, VGN]], 'Moussaka': [[G, M, E], [NV]], 'Greek Salad': [[M], [VEG]], 'Chicken Souvlaki': [[M], [NV]],
  'South Indian Thali': [[M], [VEG]], 'Lemon Rice Meal': [[N], [VEG, VGN]], 'Curd Rice': [[M, MU], [VEG]],
  'Masala Chai': [[M], [VEG]], 'Ginger Tea': [[M], [VEG]], 'Green Tea': [[], [VEG, VGN]],
};

let enriched = 0;
for (const [name, [allergens, dietaryInfo]] of Object.entries(DISHES)) {
  enriched += menu.updateMany({ name }, { $set: { allergens, dietaryInfo, allergensDeclared: true } }).modifiedCount;
}

// A declared, empty allergen list on a dish this script does not know is not a real declaration.
const undeclared = menu.updateMany(
  { name: { $nin: Object.keys(DISHES) }, $or: [{ allergens: { $size: 0 } }, { allergens: { $exists: false } }] },
  { $set: { allergensDeclared: false } },
).modifiedCount;

// Pizza sizes and extras in minor currency units. The first size keeps the base price.
const pizzas = menu.updateMany({ category: 'PIZZA' }, { $set: {
  variants: [
    { name: 'Regular 28 cm', priceModifier: NumberLong(0), isAvailable: true },
    { name: 'Large 32 cm', priceModifier: NumberLong(350), isAvailable: true },
  ],
  customizations: [
    { name: 'Extra mozzarella', price: NumberLong(200), isAvailable: true },
    { name: 'Mushrooms', price: NumberLong(150), isAvailable: true },
    { name: 'Olives', price: NumberLong(150), isAvailable: true },
    { name: 'Rocket', price: NumberLong(150), isAvailable: true },
  ],
} }).modifiedCount;

print(`menu enrichment: ${enriched} dishes with allergens and dietary marks, ${undeclared} set to not declared, ${pizzas} pizzas with sizes and extras`);
