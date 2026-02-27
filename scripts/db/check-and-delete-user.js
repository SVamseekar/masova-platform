#!/usr/bin/env node

/**
 * Check and optionally delete a user by email
 * Usage: node scripts/check-and-delete-user.js <email> [--delete]
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function checkAndDeleteUser(email, shouldDelete = false) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Find user by email (nested in personalInfo)
    const user = await usersCollection.findOne({
      'personalInfo.email': email
    });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
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
    console.log(`Role: ${user.employeeDetails?.role || 'N/A'}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Created: ${user.createdAt || 'N/A'}`);
    console.log('━'.repeat(60));

    if (shouldDelete) {
      console.log('\n🗑️  Deleting user...');
      const result = await usersCollection.deleteOne({ _id: user._id });

      if (result.deletedCount === 1) {
        console.log('✅ User deleted successfully!');
      } else {
        console.log('❌ Failed to delete user');
      }
    } else {
      console.log('\n💡 To delete this user, run:');
      console.log(`   node scripts/check-and-delete-user.js ${email} --delete`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const shouldDelete = args.includes('--delete');

if (!email) {
  console.log('Usage: node scripts/check-and-delete-user.js <email> [--delete]');
  console.log('Example: node scripts/check-and-delete-user.js praveen.kitchen@masova.com');
  console.log('         node scripts/check-and-delete-user.js praveen.kitchen@masova.com --delete');
  process.exit(1);
}

checkAndDeleteUser(email, shouldDelete);
