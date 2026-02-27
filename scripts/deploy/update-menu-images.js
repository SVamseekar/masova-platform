// MaSoVa Menu Images Update Script - Properly Curated Images
// Run: mongosh MaSoVa scripts/update-menu-images.js
// Each image has been specifically selected for the dish it represents

const menuImages = {
  // ===== SOUTH INDIAN - DOSA =====
  // Masala Dosa - crispy dosa with potato filling
  "Masala Dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800",
  // Plain Dosa - simple crispy crepe (golden folded dosa)
  "Plain Dosa": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=800",
  // Mysore Masala Dosa - red chutney dosa
  "Mysore Masala Dosa": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?w=800",
  // Cheese Dosa
  "Cheese Dosa": "https://images.unsplash.com/photo-1708146464361-5c5ce4f9abb6?w=800",
  // Ghee Roast Dosa
  "Ghee Roast Dosa": "https://images.unsplash.com/photo-1743517894265-c86ab035adef?w=800",
  // Onion Dosa
  "Onion Dosa": "https://images.unsplash.com/photo-1743615467204-8fdaa85ff2db?w=800",
  // Rava Dosa - semolina dosa with crispy texture
  "Rava Dosa": "https://images.unsplash.com/photo-1743615467363-250466982515?w=800",
  // Paper Dosa - thin crispy cone-shaped dosa
  "Paper Dosa": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=800",
  // Set Dosa - soft spongy mini dosas
  "Set Dosa (3 pcs)": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800",
  // Podi Dosa - dosa with spicy gun powder coating
  "Podi Dosa": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=800",

  // ===== SOUTH INDIAN - IDLY & VADA =====
  // Idly - white steamed rice cakes with chutney and sambar
  "Idly (3 pcs)": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
  // Medu Vada - crispy donut-shaped lentil fritters
  "Medu Vada (2 pcs)": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800",
  // Ghee Pongal - savory rice-lentil porridge with ghee
  "Ghee Pongal": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=800",
  // Idly Vada Combo - steamed idlis and fried vadas with sambar/chutney
  "Idly Vada Combo": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
  // Mini Idly Sambar - bite-sized idlis in sambar
  "Mini Idly Sambar": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800",
  // Upma - savory semolina breakfast dish
  "Upma": "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800",

  // ===== SOUTH INDIAN - MEALS =====
  // South Indian Thali - complete meal
  "South Indian Thali": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
  // Curd Rice - white yogurt rice with tempering
  "Curd Rice": "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=800",
  // Lemon Rice - yellow turmeric lemon-flavored rice
  "Lemon Rice": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
  // Tamarind Rice - tangy brown tamarind flavored rice
  "Tamarind Rice": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
  // Sambar Rice - rice mixed with lentil vegetable stew
  "Sambar Rice": "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800",
  // Bisi Bele Bath - spicy rice-lentil dish from Karnataka
  "Bisi Bele Bath": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=800",

  // ===== NORTH INDIAN - CURRIES =====
  // Paneer Butter Masala - creamy tomato gravy with paneer
  "Paneer Butter Masala": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
  // Chicken Tikka Masala
  "Chicken Tikka Masala": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
  // Palak Paneer - spinach with paneer
  "Palak Paneer": "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800",
  // Kadai Paneer
  "Kadai Paneer": "https://images.unsplash.com/photo-1690401767645-595de0e0e5f8?w=800",
  // Butter Chicken - creamy tomato chicken
  "Butter Chicken": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
  // Shahi Paneer
  "Shahi Paneer": "https://images.unsplash.com/photo-1708793873401-e8c6c153b76a?w=800",
  // Matar Paneer - peas and paneer in tomato gravy
  "Matar Paneer": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800",
  // Chana Masala - chickpea curry in spicy gravy
  "Chana Masala": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  // Aloo Gobi - dry potato and cauliflower dish
  "Aloo Gobi": "https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=800",
  // Malai Kofta
  "Malai Kofta": "https://images.unsplash.com/photo-1690401769082-5f475f87fb22?w=800",
  // Mutton Rogan Josh
  "Mutton Rogan Josh": "https://images.unsplash.com/photo-1545247181-516773cae754?w=800",
  // Egg Curry
  "Egg Curry": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",

  // ===== NORTH INDIAN - DAL =====
  // Dal Tadka - yellow lentils tempered with ghee and spices
  "Dal Tadka": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
  // Dal Makhani - creamy black lentils in buttery gravy
  "Dal Makhani": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
  // Dal Fry - light fried yellow lentils
  "Dal Fry": "https://images.unsplash.com/photo-1547592180-85f173990554?w=800",

  // ===== NORTH INDIAN - RICE/BIRYANI =====
  // Veg Biryani
  "Veg Biryani": "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800",
  // Chicken Biryani - aromatic rice with chicken
  "Chicken Biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
  // Mutton Biryani
  "Mutton Biryani": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800",
  // Egg Biryani
  "Egg Biryani": "https://images.unsplash.com/photo-1697155406055-2db32d47ca07?w=800",
  // Jeera Rice - cumin-flavored basmati rice
  "Jeera Rice": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=800",
  // Plain Rice - simple steamed white rice
  "Plain Rice": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",

  // ===== NORTH INDIAN - BREADS =====
  // Butter Naan
  "Butter Naan": "https://images.unsplash.com/photo-1611107517117-e5f1b0c898bf?w=800",
  // Garlic Naan
  "Garlic Naan": "https://images.unsplash.com/photo-1697155406014-04dc649b0953?w=800",
  // Cheese Naan
  "Cheese Naan": "https://images.unsplash.com/photo-1655979284091-eea0e93405ee?w=800",
  // Tandoori Roti
  "Tandoori Roti": "https://images.unsplash.com/photo-1611107415406-1c12f8cda424?w=800",
  // Stuffed Paratha - potato-stuffed flatbread
  "Stuffed Paratha": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
  // Laccha Paratha
  "Laccha Paratha": "https://images.unsplash.com/photo-1725483990188-41d4fb0d1e5a?w=800",

  // ===== INDO-CHINESE - FRIED RICE =====
  // Veg Fried Rice
  "Veg Fried Rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
  // Chicken Fried Rice
  "Chicken Fried Rice": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
  // Egg Fried Rice
  "Egg Fried Rice": "https://images.unsplash.com/photo-1609570324378-ec0c4c9b6ba8?w=800",
  // Schezwan Fried Rice
  "Schezwan Fried Rice": "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800",

  // ===== INDO-CHINESE - NOODLES =====
  // Hakka Noodles - stir fried noodles
  "Hakka Noodles": "https://images.unsplash.com/photo-1617622141675-d3005b9067c5?w=800",
  // Schezwan Noodles
  "Schezwan Noodles": "https://images.unsplash.com/photo-1617622141573-2e00d8818f3f?w=800",
  // Chicken Noodles
  "Chicken Noodles": "https://images.unsplash.com/photo-1679279726940-be5ce80c632c?w=800",
  // Singapore Noodles
  "Singapore Noodles": "https://images.unsplash.com/photo-1572454485051-3c9d224f90ea?w=800",

  // ===== INDO-CHINESE - MANCHURIAN =====
  // Gobi Manchurian - cauliflower in spicy sauce
  "Gobi Manchurian": "https://images.unsplash.com/photo-1682622110433-65513a55d7da?w=800",
  // Veg Manchurian - vegetable balls in spicy sauce
  "Veg Manchurian": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800",
  // Chicken Manchurian - chicken in indo-chinese sauce
  "Chicken Manchurian": "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800",
  // Chilli Paneer - spicy paneer with peppers
  "Chilli Paneer": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800",
  // Chilli Chicken - spicy chicken with green chillies
  "Chilli Chicken": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
  // Crispy Corn - golden fried corn kernels with spices
  "Crispy Corn": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
  // Spring Roll - crispy fried vegetable rolls
  "Spring Roll (4 pcs)": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",

  // ===== ITALIAN - PIZZA =====
  // Margherita Pizza - classic with basil and tomato
  "Margherita Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
  // Pepperoni Pizza
  "Pepperoni Pizza": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800",
  // Veggie Supreme Pizza
  "Veggie Supreme Pizza": "https://images.unsplash.com/photo-1598023696416-0193a0bcd302?w=800",
  // BBQ Chicken Pizza
  "BBQ Chicken Pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  // Paneer Tikka Pizza
  "Paneer Tikka Pizza": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800",
  // Four Cheese Pizza
  "Four Cheese Pizza": "https://images.unsplash.com/photo-1589187151053-5ec8818e661b?w=800",

  // ===== AMERICAN - BURGERS =====
  // Classic Veg Burger
  "Classic Veg Burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
  // Chicken Burger - juicy chicken patty
  "Chicken Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  // Paneer Tikka Burger - spiced paneer patty burger
  "Paneer Tikka Burger": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
  // Double Chicken Burger
  "Double Chicken Burger": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800",
  // Crispy Chicken Burger
  "Crispy Chicken Burger": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800",

  // ===== AMERICAN - SIDES =====
  // French Fries - golden crispy fries
  "French Fries": "https://images.unsplash.com/photo-1630431341973-02e1b662ec35?w=800",
  // Peri Peri Fries
  "Peri Peri Fries": "https://images.unsplash.com/photo-1598679253544-2c97992403ea?w=800",
  // Loaded Fries
  "Loaded Fries": "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
  // Onion Rings
  "Onion Rings": "https://images.unsplash.com/photo-1639024471283-03518883512d?w=800",
  // Coleslaw - creamy cabbage and carrot slaw
  "Coleslaw": "https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=800",

  // ===== BEVERAGES - HOT =====
  // Masala Chai - Indian spiced tea in glass
  "Masala Chai": "https://images.unsplash.com/photo-1609670438772-9cf3afc5052b?w=800",
  // Filter Coffee - South Indian brass tumbler
  "Filter Coffee": "https://images.unsplash.com/photo-1668236482744-b48b28650f12?w=800",
  // Cappuccino - espresso with thick milk foam
  "Cappuccino": "https://images.unsplash.com/photo-1534778101976-62847782c213?w=800",
  // Latte - espresso with steamed milk and latte art
  "Latte": "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=800",
  // Hot Chocolate
  "Hot Chocolate": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800",
  // Green Tea
  "Green Tea": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800",

  // ===== BEVERAGES - COLD =====
  // Mango Lassi - thick mango yogurt drink in glass
  "Mango Lassi": "https://images.unsplash.com/photo-1546173159-315724a31696?w=800",
  // Fresh Lime Soda
  "Fresh Lime Soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800",
  // Sweet Lassi - thick white yogurt drink
  "Sweet Lassi": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
  // Buttermilk - thin spiced yogurt drink
  "Buttermilk (Chaas)": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=800",
  // Iced Coffee
  "Iced Coffee": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800",
  // Mango Shake - thick mango milkshake
  "Mango Shake": "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800",
  // Chocolate Shake
  "Chocolate Shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800",
  // Strawberry Shake
  "Strawberry Shake": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800",
  // Oreo Shake - cookies and cream shake
  "Oreo Shake": "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800",
  // Fresh Orange Juice
  "Fresh Orange Juice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800",
  // Watermelon Juice
  "Watermelon Juice": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800",

  // ===== DESSERTS - ICE CREAM =====
  // Chocolate Fudge Brownie Ice Cream
  "Chocolate Fudge Brownie Ice Cream": "https://images.unsplash.com/photo-1625234969503-49c7f28bc6ec?w=800",
  // Cookie Dough Ice Cream
  "Cookie Dough Ice Cream": "https://images.unsplash.com/photo-1562790879-dfde82829db0?w=800",
  // Vanilla Ice Cream - white vanilla scoops
  "Vanilla Ice Cream": "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=800",
  // Chocolate Ice Cream - rich dark chocolate scoops
  "Chocolate Ice Cream": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
  // Strawberry Ice Cream - pink strawberry cone
  "Strawberry Ice Cream": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800",
  // Mango Ice Cream - yellow mango scoops
  "Mango Ice Cream": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800",
  // Sundae - chocolate ice cream sundae with toppings
  "Sundae (Chocolate)": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800",

  // ===== DESSERTS - INDIAN SWEETS =====
  // Gulab Jamun - golden brown balls in syrup
  "Gulab Jamun (2 pcs)": "https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?w=800",
  // Rasmalai
  "Rasmalai (2 pcs)": "https://images.unsplash.com/photo-1593701461250-d7b22dfd3a77?w=800",
  // Rasgulla
  "Rasgulla (2 pcs)": "https://images.unsplash.com/photo-1646578515903-67873a5398f9?w=800",
  // Kheer - creamy white rice pudding in bowl
  "Kheer": "https://images.unsplash.com/photo-1633383718081-22ac93e3db65?w=800",
  // Gajar Ka Halwa - orange carrot pudding dessert
  "Gajar Ka Halwa": "https://images.unsplash.com/photo-1593701461250-d7b22dfd3a77?w=800",
  // Jalebi - orange spiral fried sweets soaked in syrup
  "Jalebi (4 pcs)": "https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?w=800",

  // ===== DESSERTS - BROWNIES & COOKIES =====
  // Chocolate Chip Cookies
  "Chocolate Chip Cookies (3 pcs)": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
  // Fudge Brownie - rich chocolate brownie
  "Fudge Brownie": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
  // Brownie with Ice Cream - warm brownie topped with vanilla scoop
  "Brownie with Ice Cream": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
  // Chocolate Lava Cake
  "Chocolate Lava Cake": "https://images.unsplash.com/photo-1633981823231-2a2a7c9b014c?w=800",
  // Cheesecake
  "Cheesecake": "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800",
  // Tiramisu
  "Tiramisu": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800",
};

// Update each menu item with its image URL
let updatedCount = 0;
let notFoundCount = 0;
const notFoundItems = [];

print("Starting menu image update...\n");

for (const [name, imageUrl] of Object.entries(menuImages)) {
  const result = db.menu_items.updateMany(
    { name: name },
    { $set: { imageUrl: imageUrl, updatedAt: new Date() } }
  );

  if (result.modifiedCount > 0) {
    updatedCount += result.modifiedCount;
    print(`✓ Updated: ${name} (${result.modifiedCount} items)`);
  } else {
    notFoundCount++;
    notFoundItems.push(name);
  }
}

print("\n===================================");
print("Menu images update complete!");
print(`✓ Total items updated: ${updatedCount}`);
if (notFoundCount > 0) {
  print(`✗ Items not found: ${notFoundCount}`);
  print("Not found items:");
  notFoundItems.forEach(item => print(`  - ${item}`));
}
print("===================================");

print("\n*** IMPORTANT: Clear Redis cache to see changes ***");
print("Run: redis-cli FLUSHALL");
print("Or restart the menu-service to clear cache");
