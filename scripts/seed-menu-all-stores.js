// MaSoVa Complete Menu Seed Script - All Stores
// Run: node scripts/seed-menu-all-stores.js

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

const STORES = ['DOM001', 'DOM002', 'DOM003'];

// Image URLs for each category
const IMAGE_URLS = {
  // South Indian
  'Masala Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Plain Dosa': 'https://images.unsplash.com/photo-1630383249896-483b0eefb4b5?w=800',
  'Mysore Masala Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Cheese Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Ghee Roast Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Onion Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Rava Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Paper Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Set Dosa (3 pcs)': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Podi Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
  'Idly (3 pcs)': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
  'Medu Vada (2 pcs)': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
  'Ghee Pongal': 'https://images.unsplash.com/photo-1630383249896-483b0eefb4b5?w=800',
  'Idly Vada Combo': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
  'Mini Idly Sambar': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
  'Upma': 'https://images.unsplash.com/photo-1630383249896-483b0eefb4b5?w=800',
  'South Indian Thali': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  'Curd Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
  'Lemon Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
  'Tamarind Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
  'Sambar Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
  'Bisi Bele Bath': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',

  // North Indian
  'Paneer Butter Masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'Chicken Tikka Masala': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
  'Palak Paneer': 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=800',
  'Kadai Paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'Butter Chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800',
  'Shahi Paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'Matar Paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'Chana Masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  'Aloo Gobi': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  'Malai Kofta': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'Mutton Rogan Josh': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800',
  'Egg Curry': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800',
  'Dal Tadka': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
  'Dal Makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
  'Dal Fry': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
  'Veg Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
  'Chicken Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
  'Mutton Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
  'Egg Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
  'Jeera Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
  'Plain Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
  'Butter Naan': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
  'Garlic Naan': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
  'Cheese Naan': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
  'Tandoori Roti': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
  'Stuffed Paratha': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
  'Laccha Paratha': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',

  // Indo-Chinese
  'Veg Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
  'Chicken Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
  'Egg Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
  'Schezwan Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
  'Hakka Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
  'Schezwan Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
  'Chicken Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
  'Singapore Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
  'Gobi Manchurian': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
  'Veg Manchurian': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
  'Chicken Manchurian': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
  'Chilli Paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'Chilli Chicken': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
  'Crispy Corn': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800',
  'Spring Roll (4 pcs)': 'https://images.unsplash.com/photo-1606525437679-037aca74a3e9?w=800',

  // Italian
  'Margherita Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  'Pepperoni Pizza': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800',
  'Veggie Supreme Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  'BBQ Chicken Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  'Paneer Tikka Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  'Four Cheese Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',

  // American
  'Classic Veg Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  'Chicken Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  'Paneer Tikka Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  'Double Chicken Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  'Crispy Chicken Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  'French Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800',
  'Peri Peri Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800',
  'Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800',
  'Onion Rings': 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800',
  'Coleslaw': 'https://images.unsplash.com/photo-1625938145744-533e82abcb9d?w=800',

  // Beverages
  'Masala Chai': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
  'Filter Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
  'Cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800',
  'Latte': 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=800',
  'Hot Chocolate': 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800',
  'Green Tea': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800',
  'Mango Lassi': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800',
  'Fresh Lime Soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
  'Sweet Lassi': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800',
  'Buttermilk (Chaas)': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800',
  'Iced Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800',
  'Mango Shake': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800',
  'Chocolate Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
  'Strawberry Shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800',
  'Oreo Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
  'Fresh Orange Juice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800',
  'Watermelon Juice': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800',

  // Desserts
  'Chocolate Fudge Brownie Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
  'Cookie Dough Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
  'Vanilla Ice Cream': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800',
  'Chocolate Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
  'Strawberry Ice Cream': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800',
  'Mango Ice Cream': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800',
  'Sundae (Chocolate)': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
  'Gulab Jamun (2 pcs)': 'https://images.unsplash.com/photo-1666190050401-5c2dfc54cc42?w=800',
  'Rasmalai (2 pcs)': 'https://images.unsplash.com/photo-1666190050401-5c2dfc54cc42?w=800',
  'Rasgulla (2 pcs)': 'https://images.unsplash.com/photo-1666190050401-5c2dfc54cc42?w=800',
  'Kheer': 'https://images.unsplash.com/photo-1666190050401-5c2dfc54cc42?w=800',
  'Gajar Ka Halwa': 'https://images.unsplash.com/photo-1666190050401-5c2dfc54cc42?w=800',
  'Jalebi (4 pcs)': 'https://images.unsplash.com/photo-1666190050401-5c2dfc54cc42?w=800',
  'Chocolate Chip Cookies (3 pcs)': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
  'Fudge Brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
  'Brownie with Ice Cream': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
  'Chocolate Lava Cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
  'Cheesecake': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
  'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
};

const menuItems = [
  // ===== SOUTH INDIAN - DOSA =====
  { name: "Masala Dosa", description: "Crispy rice crepe filled with spiced potato masala", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 12000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 piece", displayOrder: 1 },
  { name: "Plain Dosa", description: "Classic crispy rice crepe", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 8000, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 2 },
  { name: "Mysore Masala Dosa", description: "Dosa with spicy red chutney and potato filling", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 14000, preparationTime: 15, spiceLevel: "HOT", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 3 },
  { name: "Cheese Dosa", description: "Crispy dosa loaded with melted cheese", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 15000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 4 },
  { name: "Ghee Roast Dosa", description: "Crispy dosa roasted in pure ghee", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 13000, preparationTime: 15, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 5 },
  { name: "Onion Dosa", description: "Crispy dosa topped with caramelized onions", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 10000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 6 },
  { name: "Rava Dosa", description: "Crispy semolina crepe with onions and chilies", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 11000, preparationTime: 12, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 7 },
  { name: "Paper Dosa", description: "Extra thin and crispy large dosa", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 10000, preparationTime: 15, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 8 },
  { name: "Set Dosa (3 pcs)", description: "Soft and spongy mini dosas", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 9000, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "3 pieces", displayOrder: 9 },
  { name: "Podi Dosa", description: "Dosa coated with spicy gun powder", cuisine: "SOUTH_INDIAN", category: "DOSA", basePrice: 11000, preparationTime: 15, spiceLevel: "HOT", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 10 },

  // ===== SOUTH INDIAN - IDLY & VADA =====
  { name: "Idly (3 pcs)", description: "Steamed rice cakes served with chutney and sambar", cuisine: "SOUTH_INDIAN", category: "IDLY_VADA", basePrice: 6000, preparationTime: 10, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, isRecommended: true, servingSize: "3 pieces", displayOrder: 11 },
  { name: "Medu Vada (2 pcs)", description: "Crispy lentil donuts served with chutney and sambar", cuisine: "SOUTH_INDIAN", category: "IDLY_VADA", basePrice: 7000, preparationTime: 12, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "2 pieces", displayOrder: 12 },
  { name: "Ghee Pongal", description: "Rice and lentil dish tempered with ghee and spices", cuisine: "SOUTH_INDIAN", category: "IDLY_VADA", basePrice: 9000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 13 },
  { name: "Idly Vada Combo", description: "2 idlies and 1 vada with chutneys and sambar", cuisine: "SOUTH_INDIAN", category: "IDLY_VADA", basePrice: 8500, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, isRecommended: true, servingSize: "1 combo", displayOrder: 14 },
  { name: "Mini Idly Sambar", description: "Small idlies served in flavorful sambar", cuisine: "SOUTH_INDIAN", category: "IDLY_VADA", basePrice: 8000, preparationTime: 10, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 15 },
  { name: "Upma", description: "Savory semolina porridge with vegetables", cuisine: "SOUTH_INDIAN", category: "IDLY_VADA", basePrice: 7000, preparationTime: 12, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 16 },

  // ===== SOUTH INDIAN - MEALS =====
  { name: "South Indian Thali", description: "Complete meal with rice, sambar, rasam, vegetables, and accompaniments", cuisine: "SOUTH_INDIAN", category: "SOUTH_INDIAN_MEALS", basePrice: 25000, preparationTime: 25, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 thali", displayOrder: 17 },
  { name: "Curd Rice", description: "Rice mixed with yogurt and tempered spices", cuisine: "SOUTH_INDIAN", category: "SOUTH_INDIAN_MEALS", basePrice: 10000, preparationTime: 10, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 18 },
  { name: "Lemon Rice", description: "Rice tempered with lemon juice, peanuts, and spices", cuisine: "SOUTH_INDIAN", category: "SOUTH_INDIAN_MEALS", basePrice: 11000, preparationTime: 12, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 19 },
  { name: "Tamarind Rice", description: "Tangy rice with tamarind paste and spices", cuisine: "SOUTH_INDIAN", category: "SOUTH_INDIAN_MEALS", basePrice: 11000, preparationTime: 12, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 20 },
  { name: "Sambar Rice", description: "Rice mixed with flavorful sambar", cuisine: "SOUTH_INDIAN", category: "SOUTH_INDIAN_MEALS", basePrice: 12000, preparationTime: 15, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 21 },
  { name: "Bisi Bele Bath", description: "Karnataka style spiced rice with lentils and vegetables", cuisine: "SOUTH_INDIAN", category: "SOUTH_INDIAN_MEALS", basePrice: 14000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 22 },

  // ===== NORTH INDIAN - CURRIES =====
  { name: "Paneer Butter Masala", description: "Cottage cheese cubes in rich tomato cream gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 22000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 23 },
  { name: "Chicken Tikka Masala", description: "Grilled chicken in spiced tomato cream sauce", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 28000, preparationTime: 25, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN", "HALAL"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 24 },
  { name: "Palak Paneer", description: "Cottage cheese cubes in creamy spinach gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 20000, preparationTime: 20, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 25 },
  { name: "Kadai Paneer", description: "Paneer in spicy tomato and capsicum gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 22000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 26 },
  { name: "Butter Chicken", description: "Tender chicken in rich buttery tomato gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 28000, preparationTime: 25, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN", "HALAL"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 27 },
  { name: "Shahi Paneer", description: "Paneer in rich creamy cashew gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 24000, preparationTime: 22, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 28 },
  { name: "Matar Paneer", description: "Cottage cheese and peas in tomato gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 20000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 29 },
  { name: "Chana Masala", description: "Chickpeas in spiced tomato gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 16000, preparationTime: 18, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 30 },
  { name: "Aloo Gobi", description: "Potato and cauliflower dry curry", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 15000, preparationTime: 18, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 31 },
  { name: "Malai Kofta", description: "Fried paneer balls in creamy gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 24000, preparationTime: 25, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 32 },
  { name: "Mutton Rogan Josh", description: "Kashmiri style mutton curry", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 32000, preparationTime: 35, spiceLevel: "HOT", dietaryInfo: ["NON_VEGETARIAN", "HALAL"], isAvailable: true, servingSize: "1 bowl", displayOrder: 33 },
  { name: "Egg Curry", description: "Boiled eggs in spiced onion tomato gravy", cuisine: "NORTH_INDIAN", category: "CURRY_GRAVY", basePrice: 18000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, servingSize: "1 bowl", displayOrder: 34 },

  // ===== NORTH INDIAN - DAL =====
  { name: "Dal Tadka", description: "Yellow lentils tempered with spices", cuisine: "NORTH_INDIAN", category: "DAL_DISHES", basePrice: 16000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 35 },
  { name: "Dal Makhani", description: "Creamy black lentils slow cooked overnight", cuisine: "NORTH_INDIAN", category: "DAL_DISHES", basePrice: 18000, preparationTime: 20, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 36 },
  { name: "Dal Fry", description: "Mixed lentils with onion tomato tempering", cuisine: "NORTH_INDIAN", category: "DAL_DISHES", basePrice: 14000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 37 },

  // ===== NORTH INDIAN - RICE =====
  { name: "Veg Biryani", description: "Fragrant basmati rice with mixed vegetables and spices", cuisine: "NORTH_INDIAN", category: "RICE_VARIETIES", basePrice: 20000, preparationTime: 25, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 plate", displayOrder: 38 },
  { name: "Chicken Biryani", description: "Aromatic basmati rice layered with spiced chicken", cuisine: "NORTH_INDIAN", category: "RICE_VARIETIES", basePrice: 25000, preparationTime: 30, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN", "HALAL"], isAvailable: true, isRecommended: true, servingSize: "1 plate", displayOrder: 39 },
  { name: "Mutton Biryani", description: "Rich basmati rice with tender mutton pieces", cuisine: "NORTH_INDIAN", category: "RICE_VARIETIES", basePrice: 30000, preparationTime: 35, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN", "HALAL"], isAvailable: true, servingSize: "1 plate", displayOrder: 40 },
  { name: "Egg Biryani", description: "Flavorful rice with boiled eggs and spices", cuisine: "NORTH_INDIAN", category: "RICE_VARIETIES", basePrice: 20000, preparationTime: 25, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, servingSize: "1 plate", displayOrder: 41 },
  { name: "Jeera Rice", description: "Basmati rice tempered with cumin seeds", cuisine: "NORTH_INDIAN", category: "RICE_VARIETIES", basePrice: 12000, preparationTime: 15, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 42 },
  { name: "Plain Rice", description: "Steamed basmati rice", cuisine: "NORTH_INDIAN", category: "RICE_VARIETIES", basePrice: 8000, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 43 },

  // ===== NORTH INDIAN - BREADS =====
  { name: "Butter Naan", description: "Soft leavened bread brushed with butter", cuisine: "NORTH_INDIAN", category: "NAAN_KULCHA", basePrice: 5000, preparationTime: 8, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 44 },
  { name: "Garlic Naan", description: "Naan bread topped with garlic and coriander", cuisine: "NORTH_INDIAN", category: "NAAN_KULCHA", basePrice: 6000, preparationTime: 8, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 piece", displayOrder: 45 },
  { name: "Cheese Naan", description: "Naan stuffed with melted cheese", cuisine: "NORTH_INDIAN", category: "NAAN_KULCHA", basePrice: 8000, preparationTime: 10, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 46 },
  { name: "Tandoori Roti", description: "Whole wheat bread baked in tandoor", cuisine: "NORTH_INDIAN", category: "CHAPATI_ROTI", basePrice: 4000, preparationTime: 8, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 47 },
  { name: "Stuffed Paratha", description: "Whole wheat bread stuffed with potato or paneer", cuisine: "NORTH_INDIAN", category: "CHAPATI_ROTI", basePrice: 7000, preparationTime: 12, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 48 },
  { name: "Laccha Paratha", description: "Layered crispy whole wheat bread", cuisine: "NORTH_INDIAN", category: "CHAPATI_ROTI", basePrice: 5500, preparationTime: 10, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 piece", displayOrder: 49 },

  // ===== INDO-CHINESE - RICE =====
  { name: "Veg Fried Rice", description: "Stir-fried rice with mixed vegetables", cuisine: "INDO_CHINESE", category: "FRIED_RICE", basePrice: 18000, preparationTime: 18, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 50 },
  { name: "Chicken Fried Rice", description: "Stir-fried rice with chicken and vegetables", cuisine: "INDO_CHINESE", category: "FRIED_RICE", basePrice: 22000, preparationTime: 20, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 plate", displayOrder: 51 },
  { name: "Egg Fried Rice", description: "Stir-fried rice with scrambled eggs", cuisine: "INDO_CHINESE", category: "FRIED_RICE", basePrice: 18000, preparationTime: 18, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, servingSize: "1 plate", displayOrder: 52 },
  { name: "Schezwan Fried Rice", description: "Spicy fried rice with schezwan sauce", cuisine: "INDO_CHINESE", category: "FRIED_RICE", basePrice: 19000, preparationTime: 18, spiceLevel: "HOT", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 53 },

  // ===== INDO-CHINESE - NOODLES =====
  { name: "Hakka Noodles", description: "Stir-fried noodles with vegetables", cuisine: "INDO_CHINESE", category: "NOODLES", basePrice: 18000, preparationTime: 18, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 54 },
  { name: "Schezwan Noodles", description: "Spicy noodles in schezwan sauce", cuisine: "INDO_CHINESE", category: "NOODLES", basePrice: 19000, preparationTime: 18, spiceLevel: "HOT", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 55 },
  { name: "Chicken Noodles", description: "Stir-fried noodles with chicken", cuisine: "INDO_CHINESE", category: "NOODLES", basePrice: 22000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 56 },
  { name: "Singapore Noodles", description: "Thin rice noodles with curry spices", cuisine: "INDO_CHINESE", category: "NOODLES", basePrice: 20000, preparationTime: 18, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 plate", displayOrder: 57 },

  // ===== INDO-CHINESE - MANCHURIAN =====
  { name: "Gobi Manchurian", description: "Crispy cauliflower in spicy Indo-Chinese sauce", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 20000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 58 },
  { name: "Veg Manchurian", description: "Mixed vegetable balls in spicy sauce", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 18000, preparationTime: 20, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 59 },
  { name: "Chicken Manchurian", description: "Crispy chicken in Indo-Chinese sauce", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 24000, preparationTime: 22, spiceLevel: "MEDIUM", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 60 },
  { name: "Chilli Paneer", description: "Paneer cubes tossed with peppers in spicy sauce", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 22000, preparationTime: 20, spiceLevel: "HOT", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 61 },
  { name: "Chilli Chicken", description: "Chicken pieces tossed with peppers in spicy sauce", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 26000, preparationTime: 22, spiceLevel: "HOT", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 62 },
  { name: "Crispy Corn", description: "Crispy fried corn kernels with spices", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 16000, preparationTime: 15, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 63 },
  { name: "Spring Roll (4 pcs)", description: "Crispy rolls filled with vegetables", cuisine: "INDO_CHINESE", category: "MANCHURIAN", basePrice: 14000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "4 pieces", displayOrder: 64 },

  // ===== ITALIAN - PIZZA =====
  { name: "Margherita Pizza", description: "Classic pizza with tomato sauce, mozzarella, and basil", cuisine: "ITALIAN", category: "PIZZA", basePrice: 25000, preparationTime: 25, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "9 inch", displayOrder: 65 },
  { name: "Pepperoni Pizza", description: "Loaded with pepperoni slices and mozzarella", cuisine: "ITALIAN", category: "PIZZA", basePrice: 32000, preparationTime: 25, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "9 inch", displayOrder: 66 },
  { name: "Veggie Supreme Pizza", description: "Loaded with bell peppers, onions, mushrooms, olives", cuisine: "ITALIAN", category: "PIZZA", basePrice: 28000, preparationTime: 25, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "9 inch", displayOrder: 67 },
  { name: "BBQ Chicken Pizza", description: "Grilled chicken with BBQ sauce and onions", cuisine: "ITALIAN", category: "PIZZA", basePrice: 34000, preparationTime: 25, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "9 inch", displayOrder: 68 },
  { name: "Paneer Tikka Pizza", description: "Fusion pizza with spiced paneer tikka", cuisine: "ITALIAN", category: "PIZZA", basePrice: 30000, preparationTime: 25, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "9 inch", displayOrder: 69 },
  { name: "Four Cheese Pizza", description: "Loaded with mozzarella, cheddar, parmesan, and gouda", cuisine: "ITALIAN", category: "PIZZA", basePrice: 32000, preparationTime: 25, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "9 inch", displayOrder: 70 },

  // ===== AMERICAN - BURGERS =====
  { name: "Classic Veg Burger", description: "Crispy veggie patty with lettuce, tomato, and mayo", cuisine: "AMERICAN", category: "BURGER", basePrice: 15000, preparationTime: 15, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 burger", displayOrder: 71 },
  { name: "Chicken Burger", description: "Grilled chicken patty with cheese and special sauce", cuisine: "AMERICAN", category: "BURGER", basePrice: 18000, preparationTime: 18, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 burger", displayOrder: 72 },
  { name: "Paneer Tikka Burger", description: "Spiced paneer patty with mint chutney", cuisine: "AMERICAN", category: "BURGER", basePrice: 17000, preparationTime: 18, spiceLevel: "MEDIUM", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 burger", displayOrder: 73 },
  { name: "Double Chicken Burger", description: "Two chicken patties with double cheese", cuisine: "AMERICAN", category: "BURGER", basePrice: 25000, preparationTime: 20, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "1 burger", displayOrder: 74 },
  { name: "Crispy Chicken Burger", description: "Crispy fried chicken with coleslaw", cuisine: "AMERICAN", category: "BURGER", basePrice: 19000, preparationTime: 18, spiceLevel: "MILD", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "1 burger", displayOrder: 75 },

  // ===== AMERICAN - SIDES =====
  { name: "French Fries", description: "Crispy golden fries", cuisine: "AMERICAN", category: "SIDES", basePrice: 10000, preparationTime: 10, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, isRecommended: true, servingSize: "1 portion", displayOrder: 76 },
  { name: "Peri Peri Fries", description: "Fries with spicy peri peri seasoning", cuisine: "AMERICAN", category: "SIDES", basePrice: 12000, preparationTime: 10, spiceLevel: "HOT", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 portion", displayOrder: 77 },
  { name: "Loaded Fries", description: "Fries with cheese, bacon bits, and sour cream", cuisine: "AMERICAN", category: "SIDES", basePrice: 16000, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["NON_VEGETARIAN"], isAvailable: true, servingSize: "1 portion", displayOrder: 78 },
  { name: "Onion Rings", description: "Crispy battered onion rings", cuisine: "AMERICAN", category: "SIDES", basePrice: 12000, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 portion", displayOrder: 79 },
  { name: "Coleslaw", description: "Fresh cabbage salad with mayo dressing", cuisine: "AMERICAN", category: "SIDES", basePrice: 6000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 portion", displayOrder: 80 },

  // ===== BEVERAGES - HOT =====
  { name: "Masala Chai", description: "Traditional Indian spiced tea", cuisine: "BEVERAGES", category: "TEA_CHAI", basePrice: 3000, preparationTime: 5, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 cup", displayOrder: 81 },
  { name: "Filter Coffee", description: "South Indian style filter coffee", cuisine: "BEVERAGES", category: "HOT_DRINKS", basePrice: 4000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 cup", displayOrder: 82 },
  { name: "Cappuccino", description: "Espresso with steamed milk foam", cuisine: "BEVERAGES", category: "HOT_DRINKS", basePrice: 12000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 cup", displayOrder: 83 },
  { name: "Latte", description: "Espresso with steamed milk", cuisine: "BEVERAGES", category: "HOT_DRINKS", basePrice: 12000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 cup", displayOrder: 84 },
  { name: "Hot Chocolate", description: "Rich hot chocolate with whipped cream", cuisine: "BEVERAGES", category: "HOT_DRINKS", basePrice: 14000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 cup", displayOrder: 85 },
  { name: "Green Tea", description: "Healthy green tea", cuisine: "BEVERAGES", category: "TEA_CHAI", basePrice: 5000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 cup", displayOrder: 86 },

  // ===== BEVERAGES - COLD =====
  { name: "Mango Lassi", description: "Sweet mango yogurt drink", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 8000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 glass", displayOrder: 87 },
  { name: "Fresh Lime Soda", description: "Refreshing lime and soda water", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 5000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 88 },
  { name: "Sweet Lassi", description: "Traditional sweet yogurt drink", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 6000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 89 },
  { name: "Buttermilk (Chaas)", description: "Spiced churned yogurt drink", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 4000, preparationTime: 5, spiceLevel: "MILD", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 90 },
  { name: "Iced Coffee", description: "Cold coffee with ice cream", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 12000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 91 },
  { name: "Mango Shake", description: "Thick mango milkshake", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 10000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 92 },
  { name: "Chocolate Shake", description: "Rich chocolate milkshake", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 10000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 93 },
  { name: "Strawberry Shake", description: "Creamy strawberry milkshake", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 10000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 94 },
  { name: "Oreo Shake", description: "Creamy Oreo milkshake", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 12000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 95 },
  { name: "Fresh Orange Juice", description: "Freshly squeezed orange juice", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 8000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 96 },
  { name: "Watermelon Juice", description: "Fresh watermelon juice", cuisine: "BEVERAGES", category: "COLD_DRINKS", basePrice: 7000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "VEGAN"], isAvailable: true, servingSize: "1 glass", displayOrder: 97 },

  // ===== DESSERTS - ICE CREAM =====
  { name: "Chocolate Fudge Brownie Ice Cream", description: "Chocolate ice cream with fudge brownies", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 35000, preparationTime: 2, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 scoop", displayOrder: 98 },
  { name: "Cookie Dough Ice Cream", description: "Vanilla ice cream with chocolate chip cookie dough", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 35000, preparationTime: 2, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, isRecommended: true, servingSize: "1 scoop", displayOrder: 99 },
  { name: "Vanilla Ice Cream", description: "Classic vanilla ice cream", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 8000, preparationTime: 2, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 scoop", displayOrder: 100 },
  { name: "Chocolate Ice Cream", description: "Rich chocolate ice cream", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 8000, preparationTime: 2, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 scoop", displayOrder: 101 },
  { name: "Strawberry Ice Cream", description: "Fresh strawberry ice cream", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 8000, preparationTime: 2, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 scoop", displayOrder: 102 },
  { name: "Mango Ice Cream", description: "Alphonso mango ice cream", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 10000, preparationTime: 2, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 scoop", displayOrder: 103 },
  { name: "Sundae (Chocolate)", description: "Ice cream sundae with chocolate sauce", cuisine: "DESSERTS", category: "ICE_CREAM", basePrice: 14000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 sundae", displayOrder: 104 },

  // ===== DESSERTS - INDIAN SWEETS =====
  { name: "Gulab Jamun (2 pcs)", description: "Deep fried milk dumplings soaked in sugar syrup", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 8000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "2 pieces", displayOrder: 105 },
  { name: "Rasmalai (2 pcs)", description: "Soft cottage cheese dumplings in sweetened milk", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 10000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "2 pieces", displayOrder: 106 },
  { name: "Rasgulla (2 pcs)", description: "Soft spongy cottage cheese balls in sugar syrup", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 8000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "2 pieces", displayOrder: 107 },
  { name: "Kheer", description: "Traditional rice pudding with nuts", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 9000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 bowl", displayOrder: 108 },
  { name: "Gajar Ka Halwa", description: "Warm carrot pudding with nuts", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 10000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, isRecommended: true, servingSize: "1 bowl", displayOrder: 109 },
  { name: "Jalebi (4 pcs)", description: "Crispy fried spirals soaked in sugar syrup", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 8000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "4 pieces", displayOrder: 110 },

  // ===== DESSERTS - BROWNIES & COOKIES =====
  { name: "Chocolate Chip Cookies (3 pcs)", description: "Freshly baked chocolate chip cookies", cuisine: "DESSERTS", category: "COOKIES_BROWNIES", basePrice: 12000, preparationTime: 15, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, servingSize: "3 pieces", displayOrder: 111 },
  { name: "Fudge Brownie", description: "Rich chocolate brownie with walnuts", cuisine: "DESSERTS", category: "COOKIES_BROWNIES", basePrice: 10000, preparationTime: 12, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, isRecommended: true, servingSize: "1 piece", displayOrder: 112 },
  { name: "Brownie with Ice Cream", description: "Warm brownie topped with vanilla ice cream", cuisine: "DESSERTS", category: "COOKIES_BROWNIES", basePrice: 16000, preparationTime: 10, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, isRecommended: true, servingSize: "1 portion", displayOrder: 113 },
  { name: "Chocolate Lava Cake", description: "Warm chocolate cake with molten center", cuisine: "DESSERTS", category: "COOKIES_BROWNIES", basePrice: 18000, preparationTime: 15, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, servingSize: "1 piece", displayOrder: 114 },
  { name: "Cheesecake", description: "New York style cheesecake", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 18000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN"], isAvailable: true, servingSize: "1 slice", displayOrder: 115 },
  { name: "Tiramisu", description: "Classic Italian coffee dessert", cuisine: "DESSERTS", category: "DESSERT_SPECIALS", basePrice: 20000, preparationTime: 5, spiceLevel: "NONE", dietaryInfo: ["VEGETARIAN", "CONTAINS_EGGS"], isAvailable: true, servingSize: "1 portion", displayOrder: 116 },
];

async function seedMenu() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const menuCollection = db.collection('menu_items');

    // Clear existing menu items
    await menuCollection.deleteMany({});
    console.log('Cleared existing menu items');

    const now = new Date();
    const allItems = [];

    // Create items for each store
    for (const storeId of STORES) {
      for (const item of menuItems) {
        const newItem = {
          ...item,
          storeId,
          imageUrl: IMAGE_URLS[item.name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
          createdAt: now,
          updatedAt: now,
        };
        allItems.push(newItem);
      }
    }

    // Insert all items
    const result = await menuCollection.insertMany(allItems);
    console.log(`Inserted ${result.insertedCount} menu items`);

    // Verify
    console.log('\n=== VERIFICATION ===');
    console.log('Total items:', await menuCollection.countDocuments());

    const distribution = await menuCollection.aggregate([
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('\nPer store:');
    distribution.forEach(d => console.log(`  ${d._id}: ${d.count} items`));

    const cuisines = await menuCollection.aggregate([
      { $match: { storeId: 'DOM001' } },
      { $group: { _id: '$cuisine', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('\nCuisines (DOM001):');
    cuisines.forEach(c => console.log(`  ${c._id}: ${c.count}`));

    console.log('\n✅ Menu seeding complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

seedMenu();
