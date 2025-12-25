#!/usr/bin/env node

/**
 * Move a user to a different store and reactivate them
 * Usage: node scripts/move-user-to-store.js <email> <newStoreId>
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function moveUserToStore(email, newStoreId) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({
      'personalInfo.email': email
    });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }

    console.log('\n📋 Current User Details:');
    console.log('━'.repeat(60));
    console.log(`Name: ${user.personalInfo?.name || 'N/A'}`);
    console.log(`Email: ${user.personalInfo?.email || 'N/A'}`);
    console.log(`Type: ${user.type || 'N/A'}`);
    console.log(`Current StoreId: ${user.employeeDetails?.storeId || 'N/A'}`);
    console.log(`Active: ${user.isActive}`);
    console.log('━'.repeat(60));

    // Update user
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          'employeeDetails.storeId': newStoreId,
          'isActive': true,
          'updatedAt': new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 1) {
      console.log('\n✅ User updated successfully!');
      console.log(`   New StoreId: ${newStoreId}`);
      console.log(`   Status: ACTIVE`);
    } else {
      console.log('❌ Failed to update user');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Parse arguments
const args = process.argv.slice(2);
const email = args[0];
const newStoreId = args[1];

if (!email || !newStoreId) {
  console.log('Usage: node scripts/move-user-to-store.js <email> <newStoreId>');
  console.log('Example: node scripts/move-user-to-store.js praveen.kitchen@masova.com DOM002');
  process.exit(1);
}

moveUserToStore(email, newStoreId);
