#!/usr/bin/env node

/**
 * MaSoVa Database Seeder
 *
 * Populates the system with realistic data via API calls.
 * Run: node scripts/seed-database.js
 *
 * Prerequisites: All 6 backend services running on Dell (192.168.50.88)
 * Order: Manager -> Stores -> Staff/Drivers -> Menu -> Customers -> Orders -> Reviews -> Inventory -> Equipment
 */

const BASE_URL = process.env.API_BASE_URL || 'http://192.168.50.88:8080';

// --- Helpers ----------------------------------------------------------------

let managerToken = null;
let managerId = null;
let managerStoreId = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token || managerToken) {
    headers['Authorization'] = 'Bearer ' + (token || managerToken);
  }
  if (managerId) headers['X-User-Id'] = managerId;
  if (managerStoreId) headers['X-Selected-Store-Id'] = managerStoreId;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const url = BASE_URL + path;
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
      console.error('  FAIL ' + method + ' ' + path + ' -> ' + res.status + ':', typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200));
      return null;
    }
    return data;
  } catch (err) {
    console.error('  ERROR ' + method + ' ' + path + ':', err.message);
    return null;
  }
}

function inrToPaise(inr) { return Math.round(inr * 100); }
function randomEl(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPhone() {
  const prefix = [6, 7, 8, 9];
  let num = String(prefix[Math.floor(Math.random() * prefix.length)]);
  for (let i = 0; i < 9; i++) num += String(randomInt(0, 9));
  return num;
}

// --- Data -------------------------------------------------------------------

const HYDERABAD_LOCATIONS = [
  { area: 'Banjara Hills', lat: 17.4156, lng: 78.4347, pin: '500034' },
  { area: 'Jubilee Hills', lat: 17.4325, lng: 78.4073, pin: '500033' },
  { area: 'Madhapur', lat: 17.4486, lng: 78.3908, pin: '500081' },
  { area: 'Gachibowli', lat: 17.4401, lng: 78.3489, pin: '500032' },
  { area: 'Kukatpally', lat: 17.4947, lng: 78.3996, pin: '500072' },
  { area: 'Ameerpet', lat: 17.4375, lng: 78.4483, pin: '500016' },
  { area: 'Begumpet', lat: 17.4440, lng: 78.4729, pin: '500003' },
  { area: 'Secunderabad', lat: 17.4399, lng: 78.4983, pin: '500003' },
  { area: 'Kondapur', lat: 17.4577, lng: 78.3718, pin: '500084' },
  { area: 'Miyapur', lat: 17.4969, lng: 78.3548, pin: '500049' },
  { area: 'Tolichowki', lat: 17.3950, lng: 78.4126, pin: '500008' },
  { area: 'Mehdipatnam', lat: 17.3950, lng: 78.4400, pin: '500028' },
  { area: 'Charminar', lat: 17.3616, lng: 78.4747, pin: '500002' },
  { area: 'Dilsukhnagar', lat: 17.3688, lng: 78.5247, pin: '500060' },
  { area: 'LB Nagar', lat: 17.3457, lng: 78.5522, pin: '500074' },
  { area: 'ECIL', lat: 17.4698, lng: 78.5718, pin: '500062' },
  { area: 'Uppal', lat: 17.4052, lng: 78.5595, pin: '500039' },
  { area: 'Manikonda', lat: 17.4052, lng: 78.3795, pin: '500089' },
  { area: 'Narsingi', lat: 17.3895, lng: 78.3567, pin: '500075' },
  { area: 'Kompally', lat: 17.5387, lng: 78.4856, pin: '500014' },
];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Priya', 'Kavya', 'Isha', 'Saanvi', 'Aanya', 'Myra', 'Sara', 'Riya',
  'Rohan', 'Karthik', 'Vikram', 'Rahul', 'Amit', 'Suresh', 'Rajesh', 'Deepak', 'Manoj', 'Naveen',
  'Sneha', 'Pooja', 'Lakshmi', 'Swathi', 'Bhavya', 'Divya', 'Neha', 'Meghana', 'Harini', 'Keerthi',
  'Pranav', 'Varun', 'Nikhil', 'Abhishek', 'Siddharth', 'Tarun', 'Chetan', 'Akash', 'Gaurav', 'Sachin',
  'Anjali', 'Shruti', 'Manasa', 'Ramya', 'Lavanya', 'Sowmya', 'Nithya', 'Tejaswi', 'Madhavi', 'Chandini',
  'Pavan', 'Venkat', 'Srikanth', 'Harsha', 'Ravi', 'Prasad', 'Mahesh', 'Ganesh', 'Sunil', 'Anil',
  'Aparna', 'Bhargavi', 'Deepthi', 'Gayatri', 'Jyothi', 'Kalyani', 'Mounika', 'Padma', 'Renuka', 'Spandana',
];

const LAST_NAMES = [
  'Reddy', 'Sharma', 'Rao', 'Kumar', 'Patel', 'Gupta', 'Singh', 'Naidu', 'Varma', 'Iyer',
  'Mukherjee', 'Pillai', 'Deshmukh', 'Joshi', 'Nair', 'Menon', 'Chowdary', 'Prasad', 'Rajan', 'Verma',
  'Agarwal', 'Bhat', 'Choudhury', 'Das', 'Hegde', 'Kulkarni', 'Mishra', 'Pandey', 'Shetty', 'Tiwari',
];

const STREET_NAMES = [
  'Road No. 1', 'Road No. 3', 'Road No. 5', 'Road No. 10', 'Road No. 12', 'Road No. 14',
  'Main Road', 'Cross Road', 'Circle', 'Lane 4', 'Street 7', 'Colony Road',
  'Phase 1', 'Phase 2', 'Sector 5', 'Block A', 'Block B', 'Marg',
];

const LANDMARKS = [
  'Near Apollo Hospital', 'Opposite City Center Mall', 'Behind Reliance Fresh', 'Near HDFC Bank',
  'Next to Ratnadeep Supermarket', 'Beside Big Bazaar', 'Near Metro Station', 'Opposite Dominos',
  'Near Indian Oil Petrol Bunk', 'Behind Government School', 'Near SBI ATM', 'Beside Passport Office',
  'Near JNTU', 'Opposite HPS', 'Near Cyber Towers', 'Behind Inorbit Mall',
];

const REVIEW_COMMENTS_POSITIVE = [
  'Amazing food! The biryani was absolutely divine.',
  'Best dosa I have had in Hyderabad. Will definitely order again!',
  'Quick delivery and food was still hot. Loved the packaging too.',
  'The paneer butter masala was restaurant quality. Highly recommended!',
  'Excellent taste and generous portions. Value for money!',
  'The naan was soft and fresh, paired perfectly with dal makhani.',
  'My go-to place for South Indian food. Never disappoints.',
  'Tried the combo meal - every dish was perfectly seasoned.',
  'Fast service and friendly delivery person. Food was delicious.',
  'The chicken 65 was crispy and spicy, just how I like it!',
  'Love the variety in the menu. Something for everyone.',
  'Fresh ingredients, you can taste the quality in every bite.',
  'Outstanding flavors! Reminds me of home-cooked food.',
  'The sambar was thick and flavorful. Perfect with idli.',
  'Great experience overall. Clean packaging and tasty food.',
];

const REVIEW_COMMENTS_NEUTRAL = [
  'Food was okay. Nothing special but decent for the price.',
  'Delivery was a bit delayed but food quality was acceptable.',
  'Average taste. Could use more spices in the gravy.',
  'Portions could be bigger for the price charged.',
  'Food was lukewarm on arrival. Taste was fine though.',
  'Decent meal but I have had better from other places.',
  'The rice was good but the curry lacked depth.',
  'Okay experience. Will try other dishes next time.',
];

const REVIEW_COMMENTS_NEGATIVE = [
  'Food arrived cold and packaging was damaged.',
  'Way too oily. Could not finish the meal.',
  'Waited over an hour for delivery. Very disappointing.',
  'The food tasted stale. Not ordering again.',
  'Completely wrong order delivered. Very frustrating.',
];

const SPECIAL_INSTRUCTIONS = [
  'Please add extra chutney',
  'No onions please',
  'Make it extra spicy',
  'Ring the doorbell twice',
  'Leave at the door',
  'Add extra napkins',
  'Please pack items separately',
  'Less salt please',
];

const CANCEL_REASONS = ['Customer requested', 'Out of stock', 'Kitchen too busy', 'Wrong address'];

// --- Menu Items (Indian restaurant themed) ----------------------------------

const MENU_ITEMS = [
  // South Indian - Dosa
  { name: 'Plain Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 80, prep: 10, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Crispy golden dosa served with sambar and coconut chutney', ingredients: ['Rice batter', 'Urad dal', 'Salt', 'Oil'], tags: ['breakfast', 'popular'] },
  { name: 'Masala Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 110, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Crispy dosa filled with spiced potato masala', ingredients: ['Rice batter', 'Potato', 'Onion', 'Mustard seeds', 'Curry leaves'], tags: ['breakfast', 'bestseller'], recommended: true },
  { name: 'Mysore Masala Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 130, prep: 15, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Spicy red chutney spread dosa with potato filling', ingredients: ['Rice batter', 'Red chutney', 'Potato', 'Onion'], tags: ['breakfast', 'spicy'] },
  { name: 'Onion Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 100, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Dosa topped with crispy onions', ingredients: ['Rice batter', 'Onion', 'Green chili'], tags: ['breakfast'] },
  { name: 'Rava Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 120, prep: 10, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Crispy semolina dosa with a lacy texture', ingredients: ['Semolina', 'Rice flour', 'All-purpose flour', 'Cumin'], tags: ['breakfast', 'crispy'] },
  { name: 'Ghee Roast Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 140, prep: 12, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Extra crispy dosa roasted in pure ghee', ingredients: ['Rice batter', 'Ghee'], tags: ['breakfast', 'premium'], recommended: true },
  { name: 'Set Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 90, prep: 10, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Soft spongy dosa served in a set of 3', ingredients: ['Rice batter', 'Urad dal'], tags: ['breakfast', 'soft'] },
  { name: 'Podi Dosa', cuisine: 'SOUTH_INDIAN', category: 'DOSA', price: 110, prep: 12, diet: ['VEGETARIAN', 'VEGAN'], spice: 'HOT', desc: 'Dosa sprinkled with spicy gun powder', ingredients: ['Rice batter', 'Podi powder', 'Sesame oil'], tags: ['breakfast', 'spicy'] },

  // South Indian - Idly/Vada
  { name: 'Idli (4 pcs)', cuisine: 'SOUTH_INDIAN', category: 'IDLY_VADA', price: 60, prep: 8, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Steamed rice cakes served with sambar and chutney', ingredients: ['Rice', 'Urad dal'], tags: ['breakfast', 'healthy'] },
  { name: 'Ghee Idli', cuisine: 'SOUTH_INDIAN', category: 'IDLY_VADA', price: 80, prep: 8, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Soft idlis drizzled with pure ghee', ingredients: ['Rice', 'Urad dal', 'Ghee'], tags: ['breakfast'] },
  { name: 'Medu Vada (3 pcs)', cuisine: 'SOUTH_INDIAN', category: 'IDLY_VADA', price: 70, prep: 10, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MILD', desc: 'Crispy lentil donuts served with sambar and chutney', ingredients: ['Urad dal', 'Green chili', 'Curry leaves', 'Ginger'], tags: ['breakfast', 'crispy'] },
  { name: 'Dahi Vada (3 pcs)', cuisine: 'SOUTH_INDIAN', category: 'IDLY_VADA', price: 90, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Soft lentil dumplings soaked in thick curd', ingredients: ['Urad dal', 'Curd', 'Sweet chutney', 'Cumin powder'], tags: ['snack'] },
  { name: 'Mini Tiffin Combo', cuisine: 'SOUTH_INDIAN', category: 'IDLY_VADA', price: 120, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: '2 idli + 1 vada + 1 mini dosa with sambar and chutneys', ingredients: ['Rice batter', 'Urad dal'], tags: ['breakfast', 'combo', 'popular'], recommended: true },

  // South Indian Meals
  { name: 'South Indian Thali', cuisine: 'SOUTH_INDIAN', category: 'SOUTH_INDIAN_MEALS', price: 180, prep: 20, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Complete meal with rice, sambar, rasam, kootu, poriyal, curd, pickle, papad and sweet', ingredients: ['Rice', 'Dal', 'Vegetables', 'Tamarind', 'Spices'], tags: ['lunch', 'thali', 'bestseller'], recommended: true },
  { name: 'Curd Rice', cuisine: 'SOUTH_INDIAN', category: 'SOUTH_INDIAN_MEALS', price: 80, prep: 8, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Comforting curd rice tempered with mustard and curry leaves', ingredients: ['Rice', 'Curd', 'Mustard seeds', 'Curry leaves'], tags: ['lunch', 'comfort'] },
  { name: 'Sambar Rice', cuisine: 'SOUTH_INDIAN', category: 'SOUTH_INDIAN_MEALS', price: 100, prep: 12, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MEDIUM', desc: 'Rice mixed with tangy sambar loaded with vegetables', ingredients: ['Rice', 'Toor dal', 'Mixed vegetables', 'Sambar powder'], tags: ['lunch'] },
  { name: 'Lemon Rice', cuisine: 'SOUTH_INDIAN', category: 'SOUTH_INDIAN_MEALS', price: 90, prep: 10, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MILD', desc: 'Tangy rice flavored with lemon and tempered with peanuts', ingredients: ['Rice', 'Lemon', 'Peanuts', 'Turmeric', 'Mustard seeds'], tags: ['lunch', 'quick'] },
  { name: 'Pesarattu', cuisine: 'SOUTH_INDIAN', category: 'SOUTH_INDIAN_MEALS', price: 100, prep: 12, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MEDIUM', desc: 'Andhra-style green gram crepe served with ginger chutney', ingredients: ['Green gram', 'Rice', 'Ginger', 'Green chili'], tags: ['breakfast', 'andhra'] },

  // North Indian - Curry
  { name: 'Paneer Butter Masala', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 220, prep: 20, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Soft paneer cubes in rich tomato-butter gravy', ingredients: ['Paneer', 'Tomato', 'Butter', 'Cream', 'Cashew', 'Spices'], tags: ['dinner', 'bestseller', 'rich'], recommended: true },
  { name: 'Butter Chicken', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 280, prep: 25, diet: ['NON_VEGETARIAN', 'HALAL'], spice: 'MILD', desc: 'Tandoori chicken in creamy tomato-butter sauce', ingredients: ['Chicken', 'Tomato', 'Butter', 'Cream', 'Fenugreek'], tags: ['dinner', 'popular', 'non-veg'], recommended: true },
  { name: 'Chicken Tikka Masala', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 260, prep: 25, diet: ['NON_VEGETARIAN', 'HALAL'], spice: 'MEDIUM', desc: 'Grilled chicken pieces in spiced tomato gravy', ingredients: ['Chicken', 'Yogurt', 'Tomato', 'Onion', 'Garam masala'], tags: ['dinner', 'non-veg'] },
  { name: 'Kadai Paneer', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 200, prep: 18, diet: ['VEGETARIAN'], spice: 'HOT', desc: 'Paneer cooked with capsicum and onion in kadai masala', ingredients: ['Paneer', 'Capsicum', 'Onion', 'Tomato', 'Kadai masala'], tags: ['dinner', 'spicy'] },
  { name: 'Palak Paneer', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 200, prep: 18, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Cottage cheese cubes in smooth spinach gravy', ingredients: ['Paneer', 'Spinach', 'Onion', 'Garlic', 'Cream'], tags: ['dinner', 'healthy'] },
  { name: 'Mutton Rogan Josh', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 350, prep: 35, diet: ['NON_VEGETARIAN', 'HALAL'], spice: 'HOT', desc: 'Tender mutton slow-cooked in Kashmiri spices', ingredients: ['Mutton', 'Yogurt', 'Kashmiri chili', 'Fennel', 'Ginger'], tags: ['dinner', 'premium', 'non-veg'] },
  { name: 'Chole Masala', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 160, prep: 18, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MEDIUM', desc: 'Spiced chickpea curry in tangy tomato gravy', ingredients: ['Chickpeas', 'Tomato', 'Onion', 'Chole masala', 'Tea leaves'], tags: ['lunch', 'popular'] },
  { name: 'Egg Curry', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 150, prep: 15, diet: ['CONTAINS_EGGS'], spice: 'MEDIUM', desc: 'Boiled eggs simmered in spicy onion-tomato gravy', ingredients: ['Eggs', 'Onion', 'Tomato', 'Spices'], tags: ['lunch', 'protein'] },
  { name: 'Aloo Gobi', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 140, prep: 15, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MILD', desc: 'Classic potato and cauliflower dry curry', ingredients: ['Potato', 'Cauliflower', 'Turmeric', 'Cumin', 'Green chili'], tags: ['lunch', 'homestyle'] },
  { name: 'Malai Kofta', cuisine: 'NORTH_INDIAN', category: 'CURRY_GRAVY', price: 220, prep: 25, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Creamy paneer-potato dumplings in rich cashew gravy', ingredients: ['Paneer', 'Potato', 'Cashew', 'Cream', 'Tomato'], tags: ['dinner', 'rich'] },

  // North Indian - Dal
  { name: 'Dal Makhani', cuisine: 'NORTH_INDIAN', category: 'DAL_DISHES', price: 180, prep: 20, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Slow-cooked black lentils in butter and cream', ingredients: ['Black urad', 'Rajma', 'Butter', 'Cream', 'Tomato'], tags: ['dinner', 'rich', 'bestseller'], recommended: true },
  { name: 'Dal Tadka', cuisine: 'NORTH_INDIAN', category: 'DAL_DISHES', price: 130, prep: 15, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MEDIUM', desc: 'Yellow lentils tempered with cumin and garlic', ingredients: ['Toor dal', 'Garlic', 'Cumin', 'Red chili', 'Ghee'], tags: ['lunch', 'everyday'] },
  { name: 'Dal Fry', cuisine: 'NORTH_INDIAN', category: 'DAL_DISHES', price: 120, prep: 12, diet: ['VEGETARIAN', 'VEGAN'], spice: 'MILD', desc: 'Mixed lentils with a flavorful onion-tomato tempering', ingredients: ['Mixed dal', 'Onion', 'Tomato', 'Cumin', 'Coriander'], tags: ['lunch'] },

  // North Indian Meals
  { name: 'North Indian Thali (Veg)', cuisine: 'NORTH_INDIAN', category: 'NORTH_INDIAN_MEALS', price: 220, prep: 22, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Complete meal with 2 curries, dal, rice, 3 roti, raita, salad, sweet', ingredients: ['Assorted'], tags: ['lunch', 'thali', 'value'], recommended: true },
  { name: 'North Indian Thali (Non-Veg)', cuisine: 'NORTH_INDIAN', category: 'NORTH_INDIAN_MEALS', price: 300, prep: 28, diet: ['NON_VEGETARIAN', 'HALAL'], spice: 'MEDIUM', desc: 'Complete meal with chicken curry, dal, rice, 3 roti, raita, salad, sweet', ingredients: ['Chicken', 'Assorted'], tags: ['lunch', 'thali', 'non-veg'] },

  // Breads
  { name: 'Tandoori Roti', cuisine: 'NORTH_INDIAN', category: 'CHAPATI_ROTI', price: 30, prep: 5, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Whole wheat bread baked in tandoor', ingredients: ['Whole wheat flour'], tags: ['bread'] },
  { name: 'Butter Roti', cuisine: 'NORTH_INDIAN', category: 'CHAPATI_ROTI', price: 40, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Soft roti brushed with butter', ingredients: ['Whole wheat flour', 'Butter'], tags: ['bread'] },
  { name: 'Laccha Paratha', cuisine: 'NORTH_INDIAN', category: 'CHAPATI_ROTI', price: 50, prep: 8, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Layered flaky paratha', ingredients: ['Whole wheat flour', 'Ghee'], tags: ['bread', 'flaky'] },
  { name: 'Aloo Paratha', cuisine: 'NORTH_INDIAN', category: 'CHAPATI_ROTI', price: 70, prep: 10, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Stuffed potato paratha served with curd and pickle', ingredients: ['Whole wheat flour', 'Potato', 'Spices'], tags: ['breakfast', 'bread'] },

  // Naan
  { name: 'Butter Naan', cuisine: 'NORTH_INDIAN', category: 'NAAN_KULCHA', price: 60, prep: 8, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Soft naan bread brushed with butter from tandoor', ingredients: ['Maida', 'Yogurt', 'Butter'], tags: ['bread', 'popular'] },
  { name: 'Garlic Naan', cuisine: 'NORTH_INDIAN', category: 'NAAN_KULCHA', price: 70, prep: 8, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Naan topped with garlic and coriander', ingredients: ['Maida', 'Garlic', 'Coriander', 'Butter'], tags: ['bread', 'bestseller'] },
  { name: 'Cheese Naan', cuisine: 'NORTH_INDIAN', category: 'NAAN_KULCHA', price: 90, prep: 10, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Naan stuffed with melted cheese', ingredients: ['Maida', 'Cheese', 'Butter'], tags: ['bread', 'cheesy'] },
  { name: 'Paneer Kulcha', cuisine: 'NORTH_INDIAN', category: 'NAAN_KULCHA', price: 80, prep: 10, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Kulcha stuffed with spiced paneer filling', ingredients: ['Maida', 'Paneer', 'Onion', 'Spices'], tags: ['bread'] },

  // Rice Varieties
  { name: 'Hyderabadi Chicken Biryani', cuisine: 'SOUTH_INDIAN', category: 'RICE_VARIETIES', price: 250, prep: 30, diet: ['NON_VEGETARIAN', 'HALAL'], spice: 'HOT', desc: 'Authentic dum biryani with tender chicken pieces, aromatic basmati rice, and saffron', ingredients: ['Basmati rice', 'Chicken', 'Saffron', 'Biryani masala', 'Mint', 'Fried onions'], tags: ['biryani', 'bestseller', 'signature'], recommended: true },
  { name: 'Hyderabadi Mutton Biryani', cuisine: 'SOUTH_INDIAN', category: 'RICE_VARIETIES', price: 320, prep: 40, diet: ['NON_VEGETARIAN', 'HALAL'], spice: 'HOT', desc: 'Premium dum biryani with succulent mutton, slow-cooked to perfection', ingredients: ['Basmati rice', 'Mutton', 'Saffron', 'Biryani masala', 'Ghee'], tags: ['biryani', 'premium', 'non-veg'], recommended: true },
  { name: 'Veg Biryani', cuisine: 'SOUTH_INDIAN', category: 'RICE_VARIETIES', price: 180, prep: 25, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Fragrant vegetable biryani with mixed veggies and aromatic spices', ingredients: ['Basmati rice', 'Mixed vegetables', 'Biryani masala', 'Mint'], tags: ['biryani', 'veg'] },
  { name: 'Egg Biryani', cuisine: 'SOUTH_INDIAN', category: 'RICE_VARIETIES', price: 180, prep: 25, diet: ['CONTAINS_EGGS'], spice: 'MEDIUM', desc: 'Flavorful biryani with boiled eggs and fragrant rice', ingredients: ['Basmati rice', 'Eggs', 'Biryani masala', 'Onion'], tags: ['biryani'] },
  { name: 'Jeera Rice', cuisine: 'NORTH_INDIAN', category: 'RICE_VARIETIES', price: 100, prep: 10, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Basmati rice tempered with cumin seeds', ingredients: ['Basmati rice', 'Cumin', 'Ghee'], tags: ['rice', 'side'] },
  { name: 'Steamed Rice', cuisine: 'SOUTH_INDIAN', category: 'RICE_VARIETIES', price: 60, prep: 8, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Plain steamed basmati rice', ingredients: ['Basmati rice'], tags: ['rice', 'side'] },

  // Indo-Chinese
  { name: 'Veg Fried Rice', cuisine: 'INDO_CHINESE', category: 'FRIED_RICE', price: 150, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Wok-tossed rice with mixed vegetables and soy sauce', ingredients: ['Rice', 'Mixed vegetables', 'Soy sauce', 'Garlic'], tags: ['chinese', 'quick'] },
  { name: 'Chicken Fried Rice', cuisine: 'INDO_CHINESE', category: 'FRIED_RICE', price: 180, prep: 15, diet: ['NON_VEGETARIAN'], spice: 'MILD', desc: 'Fried rice with chicken, eggs, and vegetables', ingredients: ['Rice', 'Chicken', 'Egg', 'Soy sauce', 'Vegetables'], tags: ['chinese', 'non-veg'] },
  { name: 'Egg Fried Rice', cuisine: 'INDO_CHINESE', category: 'FRIED_RICE', price: 140, prep: 10, diet: ['CONTAINS_EGGS'], spice: 'MILD', desc: 'Quick fried rice with scrambled eggs and spring onion', ingredients: ['Rice', 'Eggs', 'Spring onion', 'Soy sauce'], tags: ['chinese', 'quick'] },
  { name: 'Schezwan Fried Rice', cuisine: 'INDO_CHINESE', category: 'FRIED_RICE', price: 160, prep: 12, diet: ['VEGETARIAN'], spice: 'HOT', desc: 'Spicy fried rice with Schezwan sauce', ingredients: ['Rice', 'Schezwan sauce', 'Vegetables', 'Garlic'], tags: ['chinese', 'spicy'] },

  // Noodles
  { name: 'Veg Hakka Noodles', cuisine: 'INDO_CHINESE', category: 'NOODLES', price: 150, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Stir-fried noodles with crispy vegetables', ingredients: ['Noodles', 'Cabbage', 'Carrot', 'Capsicum', 'Soy sauce'], tags: ['chinese', 'popular'] },
  { name: 'Chicken Hakka Noodles', cuisine: 'INDO_CHINESE', category: 'NOODLES', price: 180, prep: 15, diet: ['NON_VEGETARIAN'], spice: 'MILD', desc: 'Hakka noodles with chicken and vegetables', ingredients: ['Noodles', 'Chicken', 'Vegetables', 'Soy sauce'], tags: ['chinese', 'non-veg'] },
  { name: 'Schezwan Noodles', cuisine: 'INDO_CHINESE', category: 'NOODLES', price: 160, prep: 12, diet: ['VEGETARIAN'], spice: 'HOT', desc: 'Spicy noodles tossed in Schezwan sauce', ingredients: ['Noodles', 'Schezwan sauce', 'Vegetables'], tags: ['chinese', 'spicy'] },

  // Manchurian
  { name: 'Veg Manchurian Dry', cuisine: 'INDO_CHINESE', category: 'MANCHURIAN', price: 160, prep: 15, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Crispy vegetable balls tossed in Manchurian sauce', ingredients: ['Mixed vegetables', 'Corn flour', 'Soy sauce', 'Garlic', 'Chili'], tags: ['chinese', 'starter'] },
  { name: 'Gobi Manchurian', cuisine: 'INDO_CHINESE', category: 'MANCHURIAN', price: 150, prep: 15, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Crispy cauliflower florets in tangy Manchurian sauce', ingredients: ['Cauliflower', 'Corn flour', 'Soy sauce', 'Chili sauce'], tags: ['chinese', 'popular'] },
  { name: 'Chicken Manchurian', cuisine: 'INDO_CHINESE', category: 'MANCHURIAN', price: 200, prep: 18, diet: ['NON_VEGETARIAN'], spice: 'MEDIUM', desc: 'Chicken pieces in Indo-Chinese Manchurian gravy', ingredients: ['Chicken', 'Soy sauce', 'Chili sauce', 'Garlic', 'Spring onion'], tags: ['chinese', 'non-veg'] },
  { name: 'Paneer Manchurian', cuisine: 'INDO_CHINESE', category: 'MANCHURIAN', price: 180, prep: 15, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Paneer cubes in spicy Manchurian sauce', ingredients: ['Paneer', 'Corn flour', 'Soy sauce', 'Garlic'], tags: ['chinese'] },
  { name: 'Chicken 65', cuisine: 'INDO_CHINESE', category: 'MANCHURIAN', price: 220, prep: 15, diet: ['NON_VEGETARIAN'], spice: 'HOT', desc: 'Hyderabadi-style spicy fried chicken', ingredients: ['Chicken', 'Yogurt', 'Red chili', 'Curry leaves', 'Ginger-garlic'], tags: ['starter', 'bestseller', 'spicy'], recommended: true },

  // Pizza
  { name: 'Margherita Pizza', cuisine: 'ITALIAN', category: 'PIZZA', price: 250, prep: 20, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Classic pizza with mozzarella, tomato sauce, and fresh basil', ingredients: ['Pizza dough', 'Mozzarella', 'Tomato sauce', 'Basil'], tags: ['pizza', 'classic'], variants: [{ name: 'Regular', mod: 0 }, { name: 'Large', mod: 100 }] },
  { name: 'Paneer Tikka Pizza', cuisine: 'ITALIAN', category: 'PIZZA', price: 320, prep: 22, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Fusion pizza with tandoori paneer, onion, capsicum', ingredients: ['Pizza dough', 'Paneer tikka', 'Onion', 'Capsicum', 'Mozzarella'], tags: ['pizza', 'fusion', 'popular'], variants: [{ name: 'Regular', mod: 0 }, { name: 'Large', mod: 120 }], recommended: true },
  { name: 'Chicken Tikka Pizza', cuisine: 'ITALIAN', category: 'PIZZA', price: 350, prep: 22, diet: ['NON_VEGETARIAN'], spice: 'MEDIUM', desc: 'Loaded with tandoori chicken, jalapenos, and mozzarella', ingredients: ['Pizza dough', 'Chicken tikka', 'Jalapeno', 'Onion', 'Mozzarella'], tags: ['pizza', 'non-veg'], variants: [{ name: 'Regular', mod: 0 }, { name: 'Large', mod: 120 }] },
  { name: 'BBQ Chicken Pizza', cuisine: 'ITALIAN', category: 'PIZZA', price: 380, prep: 22, diet: ['NON_VEGETARIAN'], spice: 'MILD', desc: 'Smoky BBQ sauce base with grilled chicken and onions', ingredients: ['Pizza dough', 'Chicken', 'BBQ sauce', 'Onion', 'Mozzarella'], tags: ['pizza', 'non-veg'], variants: [{ name: 'Regular', mod: 0 }, { name: 'Large', mod: 120 }] },

  // Burger
  { name: 'Classic Veg Burger', cuisine: 'AMERICAN', category: 'BURGER', price: 150, prep: 12, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Crispy veg patty with lettuce, tomato, and mayo', ingredients: ['Bun', 'Veg patty', 'Lettuce', 'Tomato', 'Mayo'], tags: ['burger', 'quick'] },
  { name: 'Paneer Burger', cuisine: 'AMERICAN', category: 'BURGER', price: 180, prep: 12, diet: ['VEGETARIAN'], spice: 'MEDIUM', desc: 'Grilled paneer patty with mint mayo and veggies', ingredients: ['Bun', 'Paneer patty', 'Mint mayo', 'Onion', 'Lettuce'], tags: ['burger'] },
  { name: 'Chicken Burger', cuisine: 'AMERICAN', category: 'BURGER', price: 200, prep: 15, diet: ['NON_VEGETARIAN'], spice: 'MILD', desc: 'Juicy chicken patty with cheese, lettuce, and special sauce', ingredients: ['Bun', 'Chicken patty', 'Cheese', 'Lettuce', 'Special sauce'], tags: ['burger', 'non-veg', 'popular'] },
  { name: 'Spicy Chicken Burger', cuisine: 'AMERICAN', category: 'BURGER', price: 220, prep: 15, diet: ['NON_VEGETARIAN'], spice: 'HOT', desc: 'Extra spicy fried chicken burger with jalapeno mayo', ingredients: ['Bun', 'Spicy chicken', 'Jalapeno', 'Mayo', 'Lettuce'], tags: ['burger', 'spicy', 'non-veg'] },

  // Sides
  { name: 'French Fries', cuisine: 'AMERICAN', category: 'SIDES', price: 100, prep: 8, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Crispy golden french fries with ketchup', ingredients: ['Potato', 'Salt', 'Oil'], tags: ['side', 'snack', 'popular'] },
  { name: 'Peri Peri Fries', cuisine: 'AMERICAN', category: 'SIDES', price: 130, prep: 10, diet: ['VEGETARIAN', 'VEGAN'], spice: 'HOT', desc: 'French fries tossed in spicy peri peri seasoning', ingredients: ['Potato', 'Peri peri seasoning'], tags: ['side', 'spicy'] },
  { name: 'Onion Rings', cuisine: 'AMERICAN', category: 'SIDES', price: 120, prep: 10, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Crispy battered onion rings', ingredients: ['Onion', 'Batter', 'Breadcrumbs'], tags: ['side', 'crispy'] },
  { name: 'Chicken Wings (6 pcs)', cuisine: 'AMERICAN', category: 'SIDES', price: 250, prep: 18, diet: ['NON_VEGETARIAN'], spice: 'HOT', desc: 'Crispy chicken wings tossed in hot sauce', ingredients: ['Chicken wings', 'Hot sauce', 'Garlic', 'Butter'], tags: ['starter', 'non-veg'] },

  // Beverages - Hot
  { name: 'Masala Chai', cuisine: 'BEVERAGES', category: 'TEA_CHAI', price: 40, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Traditional Indian spiced tea', ingredients: ['Tea', 'Milk', 'Ginger', 'Cardamom', 'Clove'], tags: ['beverage', 'hot'] },
  { name: 'Filter Coffee', cuisine: 'BEVERAGES', category: 'HOT_DRINKS', price: 50, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'South Indian filter coffee served in a dabara set', ingredients: ['Coffee powder', 'Chicory', 'Milk', 'Sugar'], tags: ['beverage', 'hot', 'south-indian'], recommended: true },
  { name: 'Cappuccino', cuisine: 'BEVERAGES', category: 'HOT_DRINKS', price: 120, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Rich espresso with steamed milk foam', ingredients: ['Espresso', 'Milk'], tags: ['beverage', 'coffee'] },
  { name: 'Green Tea', cuisine: 'BEVERAGES', category: 'TEA_CHAI', price: 60, prep: 5, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Refreshing green tea with a hint of honey', ingredients: ['Green tea leaves', 'Honey'], tags: ['beverage', 'healthy'] },

  // Beverages - Cold
  { name: 'Mango Lassi', cuisine: 'BEVERAGES', category: 'COLD_DRINKS', price: 80, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Creamy yogurt drink blended with alphonso mango', ingredients: ['Yogurt', 'Mango pulp', 'Sugar', 'Cardamom'], tags: ['beverage', 'cold', 'popular'] },
  { name: 'Sweet Lassi', cuisine: 'BEVERAGES', category: 'COLD_DRINKS', price: 60, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Traditional sweet yogurt drink', ingredients: ['Yogurt', 'Sugar', 'Rose water'], tags: ['beverage', 'cold'] },
  { name: 'Buttermilk (Chaas)', cuisine: 'BEVERAGES', category: 'COLD_DRINKS', price: 40, prep: 3, diet: ['VEGETARIAN'], spice: 'MILD', desc: 'Spiced buttermilk with cumin and coriander', ingredients: ['Curd', 'Cumin', 'Coriander', 'Green chili'], tags: ['beverage', 'cold', 'healthy'] },
  { name: 'Fresh Lime Soda', cuisine: 'BEVERAGES', category: 'COLD_DRINKS', price: 60, prep: 3, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Refreshing lime soda - sweet or salt', ingredients: ['Lime', 'Soda', 'Sugar or Salt'], tags: ['beverage', 'cold', 'refreshing'] },
  { name: 'Watermelon Juice', cuisine: 'BEVERAGES', category: 'COLD_DRINKS', price: 80, prep: 5, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Fresh pressed watermelon juice with mint', ingredients: ['Watermelon', 'Mint', 'Lime'], tags: ['beverage', 'cold', 'fresh'] },
  { name: 'Oreo Milkshake', cuisine: 'BEVERAGES', category: 'COLD_DRINKS', price: 150, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Thick milkshake blended with crushed Oreo cookies', ingredients: ['Milk', 'Ice cream', 'Oreo cookies'], tags: ['beverage', 'cold', 'indulgent'] },

  // Desserts
  { name: 'Gulab Jamun (2 pcs)', cuisine: 'NORTH_INDIAN', category: 'DESSERT_SPECIALS', price: 80, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Soft milk dumplings soaked in rose-flavored sugar syrup', ingredients: ['Khoya', 'Maida', 'Sugar syrup', 'Rose water', 'Cardamom'], tags: ['dessert', 'classic'] },
  { name: 'Rasmalai (2 pcs)', cuisine: 'NORTH_INDIAN', category: 'DESSERT_SPECIALS', price: 100, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Soft paneer discs in saffron-cardamom flavored milk', ingredients: ['Paneer', 'Milk', 'Saffron', 'Cardamom', 'Pistachios'], tags: ['dessert', 'premium'] },
  { name: 'Chocolate Brownie', cuisine: 'CONTINENTAL', category: 'COOKIES_BROWNIES', price: 120, prep: 5, diet: ['VEGETARIAN', 'CONTAINS_EGGS'], spice: 'NONE', desc: 'Warm gooey chocolate brownie with walnuts', ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Flour', 'Walnuts'], tags: ['dessert', 'chocolate'] },
  { name: 'Ice Cream Sundae', cuisine: 'CONTINENTAL', category: 'ICE_CREAM', price: 150, prep: 5, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Three scoops with chocolate sauce, nuts, and cherry', ingredients: ['Ice cream', 'Chocolate sauce', 'Nuts', 'Cherry', 'Wafer'], tags: ['dessert', 'cold'], variants: [{ name: 'Vanilla', mod: 0 }, { name: 'Chocolate', mod: 0 }, { name: 'Butterscotch', mod: 20 }] },
  { name: 'Double Ka Meetha', cuisine: 'SOUTH_INDIAN', category: 'DESSERT_SPECIALS', price: 90, prep: 8, diet: ['VEGETARIAN'], spice: 'NONE', desc: 'Hyderabadi bread pudding soaked in sweetened milk with dry fruits', ingredients: ['Bread', 'Milk', 'Sugar', 'Cardamom', 'Dry fruits'], tags: ['dessert', 'hyderabadi', 'traditional'] },
  { name: 'Qubani Ka Meetha', cuisine: 'SOUTH_INDIAN', category: 'DESSERT_SPECIALS', price: 110, prep: 10, diet: ['VEGETARIAN', 'VEGAN'], spice: 'NONE', desc: 'Authentic Hyderabadi apricot dessert', ingredients: ['Dried apricots', 'Sugar', 'Cream'], tags: ['dessert', 'hyderabadi'] },
];

// --- Inventory Items --------------------------------------------------------

const INVENTORY_ITEMS = [
  { name: 'Basmati Rice', code: 'RM-001', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 200, reorderLevel: 50, reorderQuantity: 100, unitCost: 80 },
  { name: 'Wheat Flour (Atta)', code: 'RM-002', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 100, reorderLevel: 30, reorderQuantity: 50, unitCost: 40 },
  { name: 'All Purpose Flour (Maida)', code: 'RM-003', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 50, reorderLevel: 15, reorderQuantity: 30, unitCost: 35 },
  { name: 'Toor Dal', code: 'RM-004', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 60, reorderLevel: 20, reorderQuantity: 40, unitCost: 120 },
  { name: 'Urad Dal', code: 'RM-005', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 40, reorderLevel: 15, reorderQuantity: 30, unitCost: 100 },
  { name: 'Chickpeas (Chana)', code: 'RM-006', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 30, reorderLevel: 10, reorderQuantity: 25, unitCost: 90 },
  { name: 'Chicken', code: 'RM-007', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 40, reorderLevel: 15, reorderQuantity: 30, unitCost: 220 },
  { name: 'Mutton', code: 'RM-008', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 20, reorderLevel: 8, reorderQuantity: 15, unitCost: 600 },
  { name: 'Paneer', code: 'RM-009', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 15, reorderLevel: 5, reorderQuantity: 12, unitCost: 280 },
  { name: 'Mozzarella Cheese', code: 'RM-010', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 10, reorderLevel: 3, reorderQuantity: 8, unitCost: 450 },
  { name: 'Fresh Vegetables Mix', code: 'RM-011', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 30, reorderLevel: 10, reorderQuantity: 25, unitCost: 50 },
  { name: 'Onions', code: 'RM-012', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 50, reorderLevel: 15, reorderQuantity: 30, unitCost: 30 },
  { name: 'Tomatoes', code: 'RM-013', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 40, reorderLevel: 12, reorderQuantity: 25, unitCost: 40 },
  { name: 'Potatoes', code: 'RM-014', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 60, reorderLevel: 20, reorderQuantity: 40, unitCost: 25 },
  { name: 'Eggs', code: 'RM-015', category: 'RAW_MATERIAL', unit: 'DOZEN', currentStock: 20, reorderLevel: 8, reorderQuantity: 15, unitCost: 72 },
  { name: 'Milk', code: 'RM-016', category: 'RAW_MATERIAL', unit: 'LITRE', currentStock: 30, reorderLevel: 10, reorderQuantity: 25, unitCost: 56 },
  { name: 'Curd/Yogurt', code: 'RM-017', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 15, reorderLevel: 5, reorderQuantity: 10, unitCost: 60 },
  { name: 'Butter', code: 'RM-018', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 8, reorderLevel: 3, reorderQuantity: 6, unitCost: 450 },
  { name: 'Ghee', code: 'RM-019', category: 'RAW_MATERIAL', unit: 'KG', currentStock: 10, reorderLevel: 4, reorderQuantity: 8, unitCost: 550 },
  { name: 'Cooking Oil', code: 'RM-020', category: 'RAW_MATERIAL', unit: 'LITRE', currentStock: 25, reorderLevel: 8, reorderQuantity: 15, unitCost: 130 },
  { name: 'Biryani Masala', code: 'ING-001', category: 'INGREDIENT', unit: 'KG', currentStock: 5, reorderLevel: 2, reorderQuantity: 4, unitCost: 400 },
  { name: 'Garam Masala', code: 'ING-002', category: 'INGREDIENT', unit: 'KG', currentStock: 5, reorderLevel: 2, reorderQuantity: 4, unitCost: 350 },
  { name: 'Red Chili Powder', code: 'ING-003', category: 'INGREDIENT', unit: 'KG', currentStock: 4, reorderLevel: 1, reorderQuantity: 3, unitCost: 300 },
  { name: 'Turmeric Powder', code: 'ING-004', category: 'INGREDIENT', unit: 'KG', currentStock: 3, reorderLevel: 1, reorderQuantity: 2, unitCost: 200 },
  { name: 'Cumin Seeds', code: 'ING-005', category: 'INGREDIENT', unit: 'KG', currentStock: 3, reorderLevel: 1, reorderQuantity: 2, unitCost: 280 },
  { name: 'Saffron', code: 'ING-006', category: 'INGREDIENT', unit: 'GRAM', currentStock: 20, reorderLevel: 5, reorderQuantity: 15, unitCost: 50 },
  { name: 'Soy Sauce', code: 'ING-007', category: 'INGREDIENT', unit: 'LITRE', currentStock: 5, reorderLevel: 2, reorderQuantity: 4, unitCost: 120 },
  { name: 'Schezwan Sauce', code: 'ING-008', category: 'INGREDIENT', unit: 'LITRE', currentStock: 4, reorderLevel: 1, reorderQuantity: 3, unitCost: 150 },
  { name: 'Pizza Sauce', code: 'ING-009', category: 'INGREDIENT', unit: 'KG', currentStock: 5, reorderLevel: 2, reorderQuantity: 4, unitCost: 180 },
  { name: 'Noodles Pack', code: 'ING-010', category: 'INGREDIENT', unit: 'KG', currentStock: 15, reorderLevel: 5, reorderQuantity: 10, unitCost: 80 },
  { name: 'Food Container (500ml)', code: 'PKG-001', category: 'PACKAGING', unit: 'PIECE', currentStock: 500, reorderLevel: 150, reorderQuantity: 300, unitCost: 5 },
  { name: 'Food Container (750ml)', code: 'PKG-002', category: 'PACKAGING', unit: 'PIECE', currentStock: 400, reorderLevel: 100, reorderQuantity: 250, unitCost: 7 },
  { name: 'Biryani Container', code: 'PKG-003', category: 'PACKAGING', unit: 'PIECE', currentStock: 300, reorderLevel: 100, reorderQuantity: 200, unitCost: 10 },
  { name: 'Pizza Box (Medium)', code: 'PKG-004', category: 'PACKAGING', unit: 'PIECE', currentStock: 200, reorderLevel: 60, reorderQuantity: 150, unitCost: 15 },
  { name: 'Paper Bags (Large)', code: 'PKG-005', category: 'PACKAGING', unit: 'PIECE', currentStock: 500, reorderLevel: 150, reorderQuantity: 300, unitCost: 8 },
  { name: 'Cutlery Set', code: 'PKG-006', category: 'PACKAGING', unit: 'SET', currentStock: 600, reorderLevel: 200, reorderQuantity: 400, unitCost: 3 },
  { name: 'Tissue Paper Pack', code: 'PKG-007', category: 'PACKAGING', unit: 'PACK', currentStock: 200, reorderLevel: 50, reorderQuantity: 100, unitCost: 12 },
  { name: 'Tea Leaves (Premium)', code: 'BEV-001', category: 'BEVERAGE', unit: 'KG', currentStock: 3, reorderLevel: 1, reorderQuantity: 2, unitCost: 400 },
  { name: 'Coffee Powder', code: 'BEV-002', category: 'BEVERAGE', unit: 'KG', currentStock: 3, reorderLevel: 1, reorderQuantity: 2, unitCost: 500 },
  { name: 'Green Tea Bags', code: 'BEV-003', category: 'BEVERAGE', unit: 'BOX', currentStock: 10, reorderLevel: 3, reorderQuantity: 6, unitCost: 150 },
  { name: 'Mango Pulp', code: 'BEV-004', category: 'BEVERAGE', unit: 'KG', currentStock: 10, reorderLevel: 3, reorderQuantity: 8, unitCost: 180 },
  { name: 'Soda Water', code: 'BEV-005', category: 'BEVERAGE', unit: 'LITRE', currentStock: 20, reorderLevel: 8, reorderQuantity: 15, unitCost: 25 },
];

// --- Suppliers --------------------------------------------------------------

const SUPPLIERS = [
  { name: 'Sri Balaji Rice Traders', code: 'SUP-001', contact: 'Ramesh Aggarwal', email: 'balaji.rice@example.com', phone: '9876543210', city: 'Hyderabad', gstin: '36AABCU9603R1ZM', terms: 'NET_30', lead: 3 },
  { name: 'Fresh Farm Produce', code: 'SUP-002', contact: 'Venkat Rao', email: 'freshfarm@example.com', phone: '9876543211', city: 'Hyderabad', gstin: '36AABCU9604R1ZN', terms: 'COD', lead: 1 },
  { name: 'Annapurna Spices & Masalas', code: 'SUP-003', contact: 'Lakshmi Devi', email: 'annapurna.spices@example.com', phone: '9876543212', city: 'Guntur', gstin: '37AABCU9605R1ZO', terms: 'NET_30', lead: 5 },
  { name: 'Global Packaging Solutions', code: 'SUP-004', contact: 'Ahmed Khan', email: 'globalpack@example.com', phone: '9876543213', city: 'Hyderabad', gstin: '36AABCU9606R1ZP', terms: 'NET_60', lead: 7 },
  { name: 'Deccan Dairy Products', code: 'SUP-005', contact: 'Priya Sharma', email: 'deccandairy@example.com', phone: '9876543214', city: 'Hyderabad', gstin: '36AABCU9607R1ZQ', terms: 'COD', lead: 1 },
  { name: 'Hyderabad Meat & Poultry', code: 'SUP-006', contact: 'Ibrahim Pasha', email: 'hydmeat@example.com', phone: '9876543215', city: 'Hyderabad', gstin: '36AABCU9608R1ZR', terms: 'COD', lead: 1 },
  { name: 'Nizam Beverages Pvt Ltd', code: 'SUP-007', contact: 'Suresh Reddy', email: 'nizambev@example.com', phone: '9876543216', city: 'Secunderabad', gstin: '36AABCU9609R1ZS', terms: 'NET_30', lead: 4 },
  { name: 'Italian Imports India', code: 'SUP-008', contact: 'Marco Fernandez', email: 'italimports@example.com', phone: '9876543217', city: 'Mumbai', gstin: '27AABCU9610R1ZT', terms: 'ADVANCE', lead: 10 },
];

// --- Equipment --------------------------------------------------------------

const EQUIPMENT = [
  { name: 'Main Tandoor Oven', type: 'OVEN', temp: 350, status: 'IN_USE' },
  { name: 'Pizza Oven', type: 'OVEN', temp: 280, status: 'IN_USE' },
  { name: 'Backup Oven', type: 'OVEN', temp: 0, status: 'AVAILABLE' },
  { name: 'Gas Stove Station 1', type: 'STOVE', status: 'IN_USE' },
  { name: 'Gas Stove Station 2', type: 'STOVE', status: 'IN_USE' },
  { name: 'Gas Stove Station 3', type: 'STOVE', status: 'AVAILABLE' },
  { name: 'Induction Cooktop', type: 'STOVE', status: 'IN_USE' },
  { name: 'Charcoal Grill', type: 'GRILL', temp: 200, status: 'IN_USE' },
  { name: 'Deep Fryer 1', type: 'FRYER', temp: 180, status: 'IN_USE' },
  { name: 'Deep Fryer 2', type: 'FRYER', temp: 180, status: 'IN_USE' },
  { name: 'Walk-in Refrigerator', type: 'REFRIGERATOR', temp: 4, status: 'IN_USE' },
  { name: 'Display Refrigerator', type: 'REFRIGERATOR', temp: 5, status: 'IN_USE' },
  { name: 'Chest Freezer', type: 'FREEZER', temp: -18, status: 'IN_USE' },
  { name: 'Ice Cream Freezer', type: 'FREEZER', temp: -20, status: 'IN_USE' },
  { name: 'Dough Mixer', type: 'MIXER', status: 'AVAILABLE' },
  { name: 'Industrial Mixer', type: 'MIXER', status: 'IN_USE' },
  { name: 'Main Dishwasher', type: 'DISHWASHER', status: 'IN_USE' },
  { name: 'Backup Dishwasher', type: 'DISHWASHER', status: 'MAINTENANCE' },
];

// --- Seeding Functions ------------------------------------------------------

async function seedManager() {
  console.log('\n=== 1. Creating Manager Account ===');
  const res = await api('POST', '/users/register', {
    type: 'MANAGER',
    name: 'Sourav Vamseekar',
    email: 'manager@masova.in',
    phone: '9000000001',
    password: 'Manager@123',
  });
  if (!res) throw new Error('Failed to create manager. Is the backend running?');
  managerToken = res.accessToken;
  managerId = res.user.id;
  console.log('  Manager created: ' + res.user.id + ' (' + res.user.email + ')');
  return res;
}

async function seedStores() {
  console.log('\n=== 2. Creating Stores ===');
  const stores = [];

  const storeData = [
    { name: 'MaSoVa Banjara Hills', code: 'DOM001', loc: HYDERABAD_LOCATIONS[0], phone: '04023456789' },
    { name: 'MaSoVa Madhapur', code: 'DOM002', loc: HYDERABAD_LOCATIONS[2], phone: '04023456790' },
    { name: 'MaSoVa Gachibowli', code: 'DOM003', loc: HYDERABAD_LOCATIONS[3], phone: '04023456791' },
  ];

  const defaultSchedule = {};
  var days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  for (var d = 0; d < days.length; d++) {
    defaultSchedule[days[d]] = {
      startTime: days[d] === 'SUNDAY' ? '10:00' : '09:00',
      endTime: '23:00',
      isOpen: true,
    };
  }

  for (var i = 0; i < storeData.length; i++) {
    var s = storeData[i];
    var res = await api('POST', '/stores', {
      name: s.name,
      storeCode: s.code,
      address: {
        street: randomEl(STREET_NAMES) + ', ' + s.loc.area,
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: s.loc.pin,
        latitude: s.loc.lat,
        longitude: s.loc.lng,
      },
      phoneNumber: s.phone,
      operatingConfig: {
        weeklySchedule: defaultSchedule,
        deliveryRadiusKm: 10,
        maxConcurrentOrders: 60,
        estimatedPrepTimeMinutes: 25,
        acceptsOnlineOrders: true,
        minimumOrderValueINR: 99,
      },
      openingDate: '2025-01-15',
    });
    if (res) {
      stores.push(res);
      console.log('  Store: ' + res.name + ' (' + res.id + ')');
    }
  }

  managerStoreId = stores[0] ? stores[0].id : null;
  return stores;
}

async function seedStaff(stores) {
  console.log('\n=== 3. Creating Staff & Drivers ===');
  var staff = [];

  var staffDefs = [
    { name: 'Raju Kiran', email: 'raju.kiran@masova.in', phone: '9100000001', type: 'STAFF', role: 'HEAD_CHEF', store: 0 },
    { name: 'Meena Kumari', email: 'meena.k@masova.in', phone: '9100000002', type: 'STAFF', role: 'SOUS_CHEF', store: 0 },
    { name: 'Prakash Yadav', email: 'prakash.y@masova.in', phone: '9100000003', type: 'STAFF', role: 'LINE_COOK', store: 0 },
    { name: 'Sunita Devi', email: 'sunita.d@masova.in', phone: '9100000004', type: 'STAFF', role: 'LINE_COOK', store: 0 },
    { name: 'Arun Teja', email: 'arun.t@masova.in', phone: '9100000005', type: 'STAFF', role: 'CASHIER', store: 0 },
    { name: 'Kavitha Reddy', email: 'kavitha.r@masova.in', phone: '9100000006', type: 'ASSISTANT_MANAGER', role: 'ASSISTANT_MANAGER', store: 0 },
    { name: 'Bharath Kumar', email: 'bharath.k@masova.in', phone: '9100000007', type: 'STAFF', role: 'HEAD_CHEF', store: 1 },
    { name: 'Lavanya Sree', email: 'lavanya.s@masova.in', phone: '9100000008', type: 'STAFF', role: 'SOUS_CHEF', store: 1 },
    { name: 'Naresh Babu', email: 'naresh.b@masova.in', phone: '9100000009', type: 'STAFF', role: 'LINE_COOK', store: 1 },
    { name: 'Swathi Priya', email: 'swathi.p@masova.in', phone: '9100000010', type: 'STAFF', role: 'CASHIER', store: 1 },
    { name: 'Vijay Shankar', email: 'vijay.s@masova.in', phone: '9100000011', type: 'ASSISTANT_MANAGER', role: 'ASSISTANT_MANAGER', store: 1 },
    { name: 'Ramya Krishna', email: 'ramya.k@masova.in', phone: '9100000012', type: 'STAFF', role: 'HEAD_CHEF', store: 2 },
    { name: 'Deepak Raj', email: 'deepak.r@masova.in', phone: '9100000013', type: 'STAFF', role: 'SOUS_CHEF', store: 2 },
    { name: 'Padma Latha', email: 'padma.l@masova.in', phone: '9100000014', type: 'STAFF', role: 'LINE_COOK', store: 2 },
    { name: 'Suresh Goud', email: 'suresh.g@masova.in', phone: '9100000015', type: 'STAFF', role: 'CASHIER', store: 2 },
  ];

  for (var i = 0; i < staffDefs.length; i++) {
    var s = staffDefs[i];
    var storeId = stores[s.store] ? stores[s.store].id : null;
    if (!storeId) continue;
    var res = await api('POST', '/users/create', {
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: 'Staff@123',
      type: s.type,
      role: s.role,
      storeId: storeId,
      permissions: ['VIEW_ORDERS', 'UPDATE_ORDERS'],
    });
    if (res) {
      staff.push(res);
      console.log('  Staff: ' + s.name + ' (' + s.role + ') -> ' + stores[s.store].name);
    }
  }

  var driverDefs = [
    { name: 'Mohammed Irfan', email: 'irfan.d@masova.in', phone: '9200000001', vehicle: 'MOTORCYCLE', license: 'TS09AB1234' },
    { name: 'Santosh Kumar', email: 'santosh.d@masova.in', phone: '9200000002', vehicle: 'MOTORCYCLE', license: 'TS09CD5678' },
    { name: 'Rakesh Yadav', email: 'rakesh.d@masova.in', phone: '9200000003', vehicle: 'MOTORCYCLE', license: 'TS09EF9012' },
    { name: 'Kiran Babu', email: 'kiran.d@masova.in', phone: '9200000004', vehicle: 'MOTORCYCLE', license: 'TS10AB3456' },
    { name: 'Rajesh Goud', email: 'rajesh.d@masova.in', phone: '9200000005', vehicle: 'MOTORCYCLE', license: 'TS10CD7890' },
    { name: 'Naveen Prasad', email: 'naveen.d@masova.in', phone: '9200000006', vehicle: 'MOTORCYCLE', license: 'TS10EF1234' },
    { name: 'Sunil Reddy', email: 'sunil.d@masova.in', phone: '9200000007', vehicle: 'BICYCLE', license: 'TS11AB5678' },
    { name: 'Manoj Teja', email: 'manoj.d@masova.in', phone: '9200000008', vehicle: 'MOTORCYCLE', license: 'TS11CD9012' },
    { name: 'Pavan Kalyan', email: 'pavan.d@masova.in', phone: '9200000009', vehicle: 'MOTORCYCLE', license: 'TS11EF3456' },
    { name: 'Anil Kumar', email: 'anil.d@masova.in', phone: '9200000010', vehicle: 'MOTORCYCLE', license: 'TS12AB7890' },
  ];

  var drivers = [];
  for (var j = 0; j < driverDefs.length; j++) {
    var d = driverDefs[j];
    var dRes = await api('POST', '/users/create', {
      name: d.name,
      email: d.email,
      phone: d.phone,
      password: 'Driver@123',
      type: 'DRIVER',
      role: 'DELIVERY_DRIVER',
      storeId: stores[0].id,
      vehicleType: d.vehicle,
      licenseNumber: d.license,
    });
    if (dRes) {
      drivers.push(dRes);
      console.log('  Driver: ' + d.name + ' (' + d.vehicle + ')');
    }
  }

  return { staff: staff, drivers: drivers };
}

async function seedMenuItems(stores) {
  console.log('\n=== 4. Creating Menu Items ===');

  for (var si = 0; si < stores.length; si++) {
    var store = stores[si];
    var items = MENU_ITEMS.map(function(item, idx) {
      var result = {
        name: item.name,
        description: item.desc,
        cuisine: item.cuisine,
        category: item.category,
        basePrice: inrToPaise(item.price),
        preparationTime: item.prep,
        dietaryInfo: item.diet,
        spiceLevel: item.spice,
        ingredients: item.ingredients,
        tags: item.tags,
        isAvailable: true,
        isRecommended: item.recommended || false,
        displayOrder: idx + 1,
        storeId: store.id,
        servingSize: '1 serving',
        customizations: [
          { name: 'Extra Spicy', price: inrToPaise(10), isAvailable: true },
          { name: 'Less Oil', price: 0, isAvailable: true },
        ],
      };
      if (item.variants) {
        result.variants = item.variants.map(function(v) {
          return { name: v.name, priceModifier: inrToPaise(v.mod) };
        });
      }
      return result;
    });

    var prevStore = managerStoreId;
    managerStoreId = store.id;

    var res = await api('POST', '/menu/items/bulk', items);
    if (res) {
      console.log('  ' + store.name + ': ' + res.length + ' menu items created');
    } else {
      var count = 0;
      for (var k = 0; k < items.length; k++) {
        var r = await api('POST', '/menu/items', items[k]);
        if (r) count++;
      }
      console.log('  ' + store.name + ': ' + count + ' menu items created (individual)');
    }

    managerStoreId = prevStore;
  }
}

async function seedCustomers(stores) {
  console.log('\n=== 5. Creating Customers ===');
  var customers = [];
  var customerUsers = [];

  var genders = ['MALE', 'FEMALE', 'OTHER'];
  var spiceLevels = ['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'];
  var paymentMethods = ['CASH', 'CARD', 'UPI'];
  var cuisines = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Continental'];
  var diets = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'];

  for (var i = 0; i < 100; i++) {
    var firstName = randomEl(FIRST_NAMES);
    var lastName = randomEl(LAST_NAMES);
    var name = firstName + ' ' + lastName;
    var email = firstName.toLowerCase() + '.' + lastName.toLowerCase() + i + '@example.com';
    var phone = randomPhone();

    var userRes = await api('POST', '/users/register', {
      type: 'CUSTOMER',
      name: name,
      email: email,
      phone: phone,
      password: 'Customer@123',
    });
    if (!userRes) continue;

    customerUsers.push(userRes);

    var dob = randomInt(1985, 2002) + '-' + String(randomInt(1, 12)).padStart(2, '0') + '-' + String(randomInt(1, 28)).padStart(2, '0');
    var customerRes = await api('POST', '/customers', {
      userId: userRes.user.id,
      storeId: stores[0].id,
      name: name,
      email: email,
      phone: phone,
      dateOfBirth: dob,
      gender: randomEl(genders),
      marketingOptIn: Math.random() > 0.3,
      smsOptIn: Math.random() > 0.5,
    });

    if (customerRes) {
      customers.push(customerRes);

      var numAddresses = randomInt(1, 3);
      var labels = ['HOME', 'WORK', 'OTHER'];
      for (var a = 0; a < numAddresses; a++) {
        var loc = randomEl(HYDERABAD_LOCATIONS);
        await api('POST', '/customers/' + customerRes.id + '/addresses', {
          label: labels[a],
          addressLine1: randomInt(1, 999) + ', ' + randomEl(STREET_NAMES),
          addressLine2: loc.area,
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: loc.pin,
          country: 'India',
          latitude: loc.lat + (Math.random() - 0.5) * 0.01,
          longitude: loc.lng + (Math.random() - 0.5) * 0.01,
          landmark: randomEl(LANDMARKS),
          isDefault: a === 0,
        });
      }

      var numCuisines = randomInt(1, 4);
      var selectedCuisines = [];
      for (var c = 0; c < numCuisines; c++) {
        var cu = randomEl(cuisines);
        if (selectedCuisines.indexOf(cu) === -1) selectedCuisines.push(cu);
      }

      await api('PUT', '/customers/' + customerRes.id + '/preferences', {
        cuisinePreferences: selectedCuisines,
        dietaryRestrictions: [randomEl(diets)],
        allergens: Math.random() > 0.7 ? [randomEl(['Peanuts', 'Milk', 'Eggs', 'Wheat'])] : [],
        preferredPaymentMethod: randomEl(paymentMethods),
        spiceLevel: randomEl(spiceLevels),
        notifyOnOffers: Math.random() > 0.3,
        notifyOnOrderStatus: true,
        favoriteMenuItems: [],
      });

      if ((i + 1) % 20 === 0) console.log('  Created ' + (i + 1) + '/100 customers...');
    }
  }

  console.log('  Total customers created: ' + customers.length);
  return { customers: customers, customerUsers: customerUsers };
}

async function seedOrders(stores, customers) {
  console.log('\n=== 6. Creating Orders ===');

  // Fetch menu for each store so orders reference correct item IDs
  var menuByStore = {};
  for (var ms = 0; ms < stores.length; ms++) {
    var menuRes = await api('GET', '/menu/items?storeId=' + stores[ms].id);
    if (menuRes && menuRes.length) {
      menuByStore[stores[ms].id] = menuRes;
      console.log('  Found ' + menuRes.length + ' menu items for ' + stores[ms].name);
    }
  }
  if (Object.keys(menuByStore).length === 0) {
    console.error('  No menu items found for any store! Skipping orders.');
    return [];
  }

  var orders = [];
  var orderTypes = ['DELIVERY', 'TAKEAWAY', 'DINE_IN'];
  var paymentMethods = ['CASH', 'CARD', 'UPI'];
  var totalOrders = 800;

  for (var i = 0; i < totalOrders; i++) {
    var customer = customers[i % customers.length];
    var storeIndex = randomInt(0, stores.length - 1);
    var store = stores[storeIndex];
    var orderType = randomEl(orderTypes);
    var paymentMethod = orderType === 'DINE_IN' ? randomEl(['CARD', 'UPI']) : randomEl(paymentMethods);

    var storeMenu = menuByStore[store.id];
    if (!storeMenu || !storeMenu.length) continue;

    var numItems = randomInt(1, 5);
    var items = [];
    var usedItemIds = [];
    for (var j = 0; j < numItems; j++) {
      var menuItem;
      var attempts = 0;
      do {
        menuItem = randomEl(storeMenu);
        attempts++;
      } while (usedItemIds.indexOf(menuItem.id) !== -1 && attempts < 10);
      if (usedItemIds.indexOf(menuItem.id) !== -1) continue;
      usedItemIds.push(menuItem.id);

      var qty = randomInt(1, 3);
      items.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: qty,
        price: (menuItem.basePrice || menuItem.price || inrToPaise(100)) / 100,
        variant: menuItem.variants && menuItem.variants[0] ? menuItem.variants[0].name : undefined,
        customizations: Math.random() > 0.7 ? ['Extra Spicy'] : undefined,
      });
    }

    if (items.length === 0) continue;

    var loc = randomEl(HYDERABAD_LOCATIONS);
    var orderBody = {
      storeId: store.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerId: customer.id,
      items: items,
      orderType: orderType,
      paymentMethod: paymentMethod,
      specialInstructions: Math.random() > 0.8 ? randomEl(SPECIAL_INSTRUCTIONS) : undefined,
    };

    if (orderType === 'DELIVERY') {
      orderBody.deliveryAddress = {
        street: randomInt(1, 999) + ', ' + randomEl(STREET_NAMES) + ', ' + loc.area,
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: loc.pin,
        latitude: loc.lat,
        longitude: loc.lng,
      };
    }

    var prevStore = managerStoreId;
    managerStoreId = store.id;

    var orderRes = await api('POST', '/orders', orderBody);
    managerStoreId = prevStore;

    if (orderRes) {
      orders.push(orderRes);

      var fate = Math.random();
      if (fate < 0.7) {
        var statuses = ['PREPARING', 'OVEN', 'BAKED', 'READY'];
        for (var si2 = 0; si2 < statuses.length; si2++) {
          await api('PATCH', '/orders/' + orderRes.id + '/status', { status: statuses[si2] });
        }
        var finalStatus;
        if (orderType === 'DELIVERY') {
          await api('PATCH', '/orders/' + orderRes.id + '/status', { status: 'DISPATCHED' });
          await api('PATCH', '/orders/' + orderRes.id + '/status', { status: 'DELIVERED' });
          finalStatus = 'DELIVERED';
        } else if (orderType === 'TAKEAWAY') {
          await api('PATCH', '/orders/' + orderRes.id + '/status', { status: 'COMPLETED' });
          finalStatus = 'COMPLETED';
        } else {
          await api('PATCH', '/orders/' + orderRes.id + '/status', { status: 'SERVED' });
          finalStatus = 'SERVED';
        }
        orderRes.status = finalStatus;
        await api('PATCH', '/orders/' + orderRes.id + '/payment', { status: 'PAID', transactionId: 'TXN' + Date.now() + i });
      } else if (fate < 0.8) {
        await api('DELETE', '/orders/' + orderRes.id + '?reason=' + encodeURIComponent(randomEl(CANCEL_REASONS)));
        orderRes.status = 'CANCELLED';
      } else {
        var stagesCount = randomInt(1, 3);
        var stages = ['PREPARING', 'OVEN', 'BAKED'];
        for (var st = 0; st < stagesCount; st++) {
          await api('PATCH', '/orders/' + orderRes.id + '/status', { status: stages[st] });
        }
      }
    }

    if ((i + 1) % 100 === 0) console.log('  Created ' + (i + 1) + '/' + totalOrders + ' orders...');
  }

  console.log('  Total orders created: ' + orders.length);
  return orders;
}

async function seedReviews(orders) {
  console.log('\n=== 7. Creating Reviews ===');
  var reviewCount = 0;

  var completedOrders = orders.filter(function(o) {
    return o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'SERVED';
  });
  var ordersToReview = completedOrders.slice(0, Math.floor(completedOrders.length * 0.4));

  for (var i = 0; i < ordersToReview.length; i++) {
    var order = ordersToReview[i];
    var rating = randomInt(1, 5);
    var weightedRating = Math.random() > 0.3 ? Math.max(rating, 3) : rating;

    var comments;
    if (weightedRating >= 4) comments = REVIEW_COMMENTS_POSITIVE;
    else if (weightedRating === 3) comments = REVIEW_COMMENTS_NEUTRAL;
    else comments = REVIEW_COMMENTS_NEGATIVE;

    var reviewBody = {
      orderId: order.id,
      overallRating: weightedRating,
      comment: randomEl(comments),
      foodQualityRating: Math.min(5, Math.max(1, weightedRating + randomInt(-1, 1))),
      serviceRating: Math.min(5, Math.max(1, weightedRating + randomInt(-1, 1))),
      isAnonymous: Math.random() > 0.85,
    };

    if (order.orderType === 'DELIVERY') {
      reviewBody.deliveryRating = Math.min(5, Math.max(1, weightedRating + randomInt(-1, 1)));
    }

    if (Math.random() > 0.7 && order.items && order.items.length > 0) {
      reviewBody.itemReviews = order.items.slice(0, 2).map(function(item) {
        return {
          menuItemId: item.menuItemId,
          rating: Math.min(5, Math.max(1, weightedRating + randomInt(-1, 1))),
          comment: Math.random() > 0.5 ? item.name + ' was ' + randomEl(['great', 'good', 'okay', 'delicious', 'tasty']) : undefined,
        };
      });
    }

    var res = await api('POST', '/reviews', reviewBody);
    if (res) reviewCount++;

    if (reviewCount % 50 === 0 && reviewCount > 0) console.log('  Created ' + reviewCount + ' reviews...');
  }

  console.log('  Total reviews created: ' + reviewCount);
}

async function seedInventory(stores) {
  console.log('\n=== 8. Creating Inventory Items ===');
  var count = 0;

  for (var si = 0; si < stores.length; si++) {
    var storeCount = 0;
    for (var i = 0; i < INVENTORY_ITEMS.length; i++) {
      var item = INVENTORY_ITEMS[i];
      var res = await api('POST', '/inventory/items', {
        itemName: item.name,
        itemCode: item.code + '-S' + (si + 1),
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        reorderQuantity: item.reorderQuantity,
        unitCost: item.unitCost,
        storeId: stores[si].id,
        isActive: true,
      });
      if (res) { count++; storeCount++; }
    }
    console.log('  ' + stores[si].name + ': ' + storeCount + ' inventory items');
  }
  console.log('  Total inventory items created: ' + count);
}

async function seedSuppliers() {
  console.log('\n=== 9. Creating Suppliers ===');
  var suppliers = [];

  for (var i = 0; i < SUPPLIERS.length; i++) {
    var s = SUPPLIERS[i];
    var res = await api('POST', '/inventory/suppliers', {
      supplierName: s.name,
      supplierCode: s.code,
      contactPerson: s.contact,
      email: s.email,
      phone: s.phone,
      address: randomEl(STREET_NAMES) + ', ' + s.city,
      city: s.city,
      state: s.city === 'Mumbai' ? 'Maharashtra' : s.city === 'Guntur' ? 'Andhra Pradesh' : 'Telangana',
      pincode: randomEl(HYDERABAD_LOCATIONS).pin,
      gstin: s.gstin,
      paymentTerms: s.terms,
      leadTimeDays: s.lead,
      minimumOrderValue: 500,
      deliveryCharges: s.lead > 5 ? 500 : 0,
      status: 'ACTIVE',
    });
    if (res) {
      suppliers.push(res);
      console.log('  Supplier: ' + s.name);
    }
  }
  return suppliers;
}

async function seedEquipment(stores) {
  console.log('\n=== 10. Creating Kitchen Equipment ===');
  var count = 0;

  for (var si = 0; si < stores.length; si++) {
    var storeCount = 0;
    for (var i = 0; i < EQUIPMENT.length; i++) {
      var eq = EQUIPMENT[i];
      var res = await api('POST', '/kitchen-equipment', {
        equipmentName: eq.name,
        type: eq.type,
        status: eq.status,
        temperature: eq.temp || undefined,
        isOn: eq.status === 'IN_USE',
        storeId: stores[si].id,
      });
      if (res) { count++; storeCount++; }
    }
    console.log('  ' + stores[si].name + ': ' + storeCount + ' equipment items');
  }
  console.log('  Total equipment items created: ' + count);
}

async function seedCashPayments(orders) {
  console.log('\n=== 11. Recording Cash Payments ===');
  var count = 0;

  var cashOrders = orders.filter(function(o) { return o.paymentMethod === 'CASH' && o.status !== 'CANCELLED'; });
  var toProcess = cashOrders.slice(0, 100);
  for (var i = 0; i < toProcess.length; i++) {
    var order = toProcess[i];
    var amountPaise = order.total || order.totalAmount || 10000;
    var res = await api('POST', '/payments/cash', {
      orderId: order.id,
      amount: amountPaise / 100,
      customerId: order.customerId,
      storeId: order.storeId,
      orderType: order.orderType,
      paymentMethod: 'CASH',
    });
    if (res) count++;
  }
  console.log('  Cash payments recorded: ' + count);
}

async function seedLoyaltyPoints(customers) {
  console.log('\n=== 12. Adding Loyalty Points ===');
  var count = 0;

  var toAward = customers.slice(0, 60);
  for (var i = 0; i < toAward.length; i++) {
    var points = randomInt(50, 500);
    var res = await api('POST', '/customers/' + toAward[i].id + '/loyalty/points', {
      points: points,
      type: 'EARNED',
      description: 'Points earned from orders',
    });
    if (res) count++;
  }
  console.log('  Loyalty points awarded: ' + count + ' customers');
}

async function seedKiosks(stores) {
  console.log('\n=== 13. Creating Kiosks ===');

  for (var i = 0; i < stores.length; i++) {
    for (var k = 1; k <= 2; k++) {
      var terminalId = 'POS-' + String(i * 2 + k).padStart(2, '0');
      var res = await api('POST', '/users/kiosk/create', {
        storeId: stores[i].id,
        terminalId: terminalId,
      });
      if (res) {
        console.log('  Kiosk: ' + terminalId + ' -> ' + stores[i].name);
      }
    }
  }
}

// --- Main -------------------------------------------------------------------

async function main() {
  console.log('+=================================================+');
  console.log('|        MaSoVa Database Seeder v1.0               |');
  console.log('|        Target: ' + BASE_URL.padEnd(33) + '|');
  console.log('+=================================================+');

  var startTime = Date.now();

  try {
    // Phase 1: Foundation
    await seedManager();
    var stores = await seedStores();
    if (!stores.length) throw new Error('No stores created. Aborting.');

    // Phase 2: People
    var staffResult = await seedStaff(stores);
    var customerResult = await seedCustomers(stores);

    // Phase 3: Products
    await seedMenuItems(stores);

    // Phase 4: Transactions
    var orders = await seedOrders(stores, customerResult.customers);
    await seedCashPayments(orders);

    // Phase 5: Feedback & Operations
    await seedReviews(orders);
    await seedLoyaltyPoints(customerResult.customers);
    await seedInventory(stores);
    await seedSuppliers();
    await seedEquipment(stores);
    await seedKiosks(stores);

    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n+=================================================+');
    console.log('|              SEEDING COMPLETE!                   |');
    console.log('+-------------------------------------------------+');
    console.log('|  Stores:       ' + String(stores.length).padEnd(33) + '|');
    console.log('|  Staff:        ' + String(staffResult.staff.length).padEnd(33) + '|');
    console.log('|  Drivers:      ' + String(staffResult.drivers.length).padEnd(33) + '|');
    console.log('|  Customers:    ' + String(customerResult.customers.length).padEnd(33) + '|');
    console.log('|  Menu Items:   ' + String(MENU_ITEMS.length + ' per store').padEnd(33) + '|');
    console.log('|  Orders:       ' + String(orders.length).padEnd(33) + '|');
    console.log('|  Inventory:    ' + String(INVENTORY_ITEMS.length + ' x ' + stores.length + ' stores').padEnd(33) + '|');
    console.log('|  Suppliers:    ' + String(SUPPLIERS.length).padEnd(33) + '|');
    console.log('|  Equipment:    ' + String(EQUIPMENT.length + ' x ' + stores.length + ' stores').padEnd(33) + '|');
    console.log('|  Time:         ' + String(elapsed + 's').padEnd(33) + '|');
    console.log('+-------------------------------------------------+');
    console.log('|  Login Credentials:                              |');
    console.log('|  Manager:  manager@masova.in / Manager@123       |');
    console.log('|  Staff:    *.@masova.in / Staff@123              |');
    console.log('|  Drivers:  *.d@masova.in / Driver@123            |');
    console.log('|  Customers: *.@example.com / Customer@123        |');
    console.log('+=================================================+');

  } catch (err) {
    console.error('\nFATAL:', err.message);
    process.exit(1);
  }
}

main();
