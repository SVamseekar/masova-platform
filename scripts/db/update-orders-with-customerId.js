// MongoDB Script to Update Existing Orders with customerId
// This script links orders to customer profiles based on customerName

// Connect to MongoDB
// Run this script using: mongosh mongodb://localhost:27017/masova_orders --file scripts/update-orders-with-customerId.js

// Database connections
const orderDb = db.getSiblingDB('masova_orders');
const customerDb = db.getSiblingDB('masova_customers');

print('\n=== Starting Order-Customer Linking Process ===\n');

// Get all customers from customer database
print('Step 1: Fetching all customers from customer database...');
const customers = customerDb.customers.find({}).toArray();
print(`Found ${customers.length} customers in the database\n`);

// Display customers for reference
print('Available Customers:');
customers.forEach(customer => {
  print(`  - ID: ${customer._id}, Name: ${customer.name}, Email: ${customer.email}`);
});
print('');

// Get all orders without customerId
print('Step 2: Fetching orders without customerId...');
const ordersWithoutCustomerId = orderDb.orders.find({
  $or: [
    { customerId: { $exists: false } },
    { customerId: null },
    { customerId: '' }
  ]
}).toArray();

print(`Found ${ordersWithoutCustomerId.length} orders without customerId\n`);

if (ordersWithoutCustomerId.length === 0) {
  print('✅ All orders already have customerId assigned!\n');
  quit();
}

// Create a map of customer names to customer IDs for easy lookup
const customerNameMap = {};
customers.forEach(customer => {
  // Normalize name for matching (lowercase, trim spaces)
  const normalizedName = customer.name.toLowerCase().trim();
  customerNameMap[normalizedName] = customer._id.toString();
});

print('Step 3: Matching orders to customers by name...\n');

let matchedCount = 0;
let unmatchedCount = 0;
const unmatchedOrders = [];

ordersWithoutCustomerId.forEach(order => {
  const orderName = order.customerName ? order.customerName.toLowerCase().trim() : '';

  if (customerNameMap[orderName]) {
    const customerId = customerNameMap[orderName];

    // Update the order with customerId
    const result = orderDb.orders.updateOne(
      { _id: order._id },
      { $set: { customerId: customerId } }
    );

    if (result.modifiedCount > 0) {
      matchedCount++;
      print(`✅ Updated Order ${order.orderNumber} (${order.customerName}) → Customer ID: ${customerId}`);
    }
  } else {
    unmatchedCount++;
    unmatchedOrders.push({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      orderId: order._id
    });
    print(`⚠️  No match found for Order ${order.orderNumber} with customerName: "${order.customerName}"`);
  }
});

print('\n=== Update Summary ===');
print(`Total orders processed: ${ordersWithoutCustomerId.length}`);
print(`✅ Successfully matched and updated: ${matchedCount}`);
print(`⚠️  Unmatched orders: ${unmatchedCount}\n`);

if (unmatchedOrders.length > 0) {
  print('Unmatched Orders List:');
  unmatchedOrders.forEach(order => {
    print(`  - Order #${order.orderNumber}: "${order.customerName}" (ID: ${order.orderId})`);
  });
  print('\nNote: You may need to manually update these orders or create customer profiles for these names.\n');
}

// Verify the updates
print('Step 4: Verification - Checking updated orders...\n');

const priyaCustomer = customers.find(c => c.name.toLowerCase().includes('priya'));
const souraCustomer = customers.find(c => c.name.toLowerCase().includes('soura') || c.name.toLowerCase().includes('vamseekar'));

if (priyaCustomer) {
  const priyaOrders = orderDb.orders.find({ customerId: priyaCustomer._id.toString() }).toArray();
  print(`Priya Sharma (${priyaCustomer._id}): ${priyaOrders.length} orders`);
}

if (souraCustomer) {
  const souraOrders = orderDb.orders.find({ customerId: souraCustomer._id.toString() }).toArray();
  print(`${souraCustomer.name} (${souraCustomer._id}): ${souraOrders.length} orders`);
}

print('\n=== Script Completed Successfully ===\n');
