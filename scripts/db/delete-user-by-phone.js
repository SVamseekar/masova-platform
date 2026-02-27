#!/usr/bin/env node

/**
 * Delete a user by phone number
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function deleteUserByPhone(phone) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({
      'personalInfo.phone': phone
    });

    if (!user) {
      console.log(`❌ No user found with phone: ${phone}`);
      return;
    }

    console.log('\n📋 User Found:');
    console.log('━'.repeat(60));
    console.log(`ID: ${user._id}`);
    console.log(`Name: ${user.personalInfo?.name || 'N/A'}`);
    console.log(`Email: ${user.personalInfo?.email || 'N/A'}`);
    console.log(`Phone: ${user.personalInfo?.phone || 'N/A'}`);
    console.log(`Type: ${user.type || 'N/A'}`);
    console.log(`StoreId: ${user.employeeDetails?.storeId || 'N/A'}`);
    console.log(`Active: ${user.isActive}`);
    console.log('━'.repeat(60));

    console.log('\n🗑️  Deleting user...');
    const result = await usersCollection.deleteOne({ _id: user._id });

    if (result.deletedCount === 1) {
      console.log('✅ User deleted successfully!');
    } else {
      console.log('❌ Failed to delete user');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const phone = process.argv[2];

if (!phone) {
  console.log('Usage: node scripts/delete-user-by-phone.js <phone>');
  console.log('Example: node scripts/delete-user-by-phone.js 9876543222');
  process.exit(1);
}

deleteUserByPhone(phone);
