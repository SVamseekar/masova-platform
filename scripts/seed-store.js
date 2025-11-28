// MaSoVa Store Seed Script for MongoDB
// Run with: mongosh MaSoVa seed-store.js

// Switch to MaSoVa database
db = db.getSiblingDB('MaSoVa');

// Store data
const storeData = {
  _id: 'store-1',
  name: 'MaSoVa Banjara Hills',
  code: 'MSV002',
  address: {
    street: 'Road No. 12, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    latitude: 17.4126,
    longitude: 78.4482
  },
  phoneNumber: '9876543210',
  regionId: 'region-1',
  status: 'ACTIVE',
  operatingHours: {
    weeklySchedule: {
      MONDAY: { startTime: '10:00', endTime: '22:00' },
      TUESDAY: { startTime: '10:00', endTime: '22:00' },
      WEDNESDAY: { startTime: '10:00', endTime: '22:00' },
      THURSDAY: { startTime: '10:00', endTime: '22:00' },
      FRIDAY: { startTime: '10:00', endTime: '23:00' },
      SATURDAY: { startTime: '10:00', endTime: '23:00' },
      SUNDAY: { startTime: '11:00', endTime: '22:00' }
    },
    specialHours: []
  },
  configuration: {
    deliveryRadiusKm: 10.0,
    maxConcurrentOrders: 50,
    estimatedPrepTimeMinutes: 30,
    acceptsOnlineOrders: true,
    acceptsCashPayments: true,
    maxDeliveryTimeMinutes: 30,
    minimumOrderValueINR: 200.0
  },
  openingDate: new Date('2024-01-01'),
  createdAt: new Date(),
  lastModified: new Date(),
  _class: 'com.MaSoVa.shared.entity.Store'
};

// Check if store already exists
const existingStore = db.stores.findOne({ _id: 'store-1' });

if (existingStore) {
  print('Store with ID "store-1" already exists. Updating...');
  db.stores.updateOne(
    { _id: 'store-1' },
    { $set: { ...storeData, lastModified: new Date() } }
  );
  print('Store updated successfully!');
} else {
  print('Creating new store with ID "store-1"...');
  db.stores.insertOne(storeData);
  print('Store created successfully!');
}

// Verify the store
const verifyStore = db.stores.findOne({ _id: 'store-1' });
print('\nStore details:');
print('  ID: ' + verifyStore._id);
print('  Name: ' + verifyStore.name);
print('  Code: ' + verifyStore.code);
print('  Status: ' + verifyStore.status);
print('  Address: ' + verifyStore.address.street + ', ' + verifyStore.address.city);

print('\n✅ Store seeding completed successfully!');
