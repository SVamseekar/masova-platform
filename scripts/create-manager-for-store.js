#!/usr/bin/env node

/**
 * Create a manager account for a specific store
 * Usage: node scripts/create-manager-for-store.js <storeId> <name> <email> <phone>
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function createManager(storeId, name, email, phone) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Check if email already exists
    const existing = await usersCollection.findOne({ 'personalInfo.email': email });
    if (existing) {
      console.log(`❌ User with email ${email} already exists`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('Manager@123', 10);

    // Generate 5-digit PIN
    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    const pinHash = await bcrypt.hash(pin, 10);
    const pinSuffix = pin.slice(-2);

    const manager = {
      type: 'MANAGER',
      personalInfo: {
        name: name,
        email: email,
        phone: phone,
        passwordHash: passwordHash
      },
      employeeDetails: {
        storeId: storeId,
        role: 'Store Manager',
        permissions: [
          'MANAGE_ORDERS',
          'MANAGE_MENU',
          'MANAGE_STAFF',
          'MANAGE_INVENTORY',
          'VIEW_REPORTS',
          'MANAGE_CUSTOMERS'
        ],
        schedule: {
          maxHoursPerWeek: 48
        },
        employeePINHash: pinHash,
        pinSuffix: pinSuffix,
        isKioskAccount: false
      },
      createdAt: new Date(),
      isActive: true,
      _class: 'com.MaSoVa.shared.entity.User'
    };

    const result = await usersCollection.insertOne(manager);

    console.log('\n✅ Manager created successfully!');
    console.log('━'.repeat(60));
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Store: ${storeId}`);
    console.log(`Password: Manager@123`);
    console.log(`PIN: ${pin}`);
    console.log(`User ID: ${result.insertedId}`);
    console.log('━'.repeat(60));
    console.log('\n📝 Save this PIN! The manager will need it to clock in staff.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Parse arguments
const args = process.argv.slice(2);
const storeId = args[0];
const name = args[1];
const email = args[2];
const phone = args[3];

if (!storeId || !name || !email || !phone) {
  console.log('Usage: node scripts/create-manager-for-store.js <storeId> <name> <email> <phone>');
  console.log('Example: node scripts/create-manager-for-store.js DOM002 "Rajesh Manager" rajesh.manager@masova.com 9876543211');
  process.exit(1);
}

createManager(storeId, name, email, phone);
