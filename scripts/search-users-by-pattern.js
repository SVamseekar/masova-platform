#!/usr/bin/env node

/**
 * Search users by email pattern
 * Usage: node scripts/search-users-by-pattern.js <pattern>
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function searchUsers(pattern) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Search by regex pattern
    const users = await usersCollection.find({
      'personalInfo.email': { $regex: pattern, $options: 'i' }
    }).toArray();

    if (users.length === 0) {
      console.log(`❌ No users found matching pattern: ${pattern}`);
      return;
    }

    console.log(`\n📋 Found ${users.length} user(s):\n`);
    console.log('━'.repeat(100));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.personalInfo?.name || 'N/A'}`);
      console.log(`   Email: ${user.personalInfo?.email || 'N/A'}`);
      console.log(`   Type: ${user.type || 'N/A'} | StoreId: ${user.employeeDetails?.storeId || 'N/A'} | Active: ${user.isActive}`);
      console.log(`   ID: ${user._id}`);
      console.log('━'.repeat(100));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const pattern = process.argv[2];

if (!pattern) {
  console.log('Usage: node scripts/search-users-by-pattern.js <pattern>');
  console.log('Example: node scripts/search-users-by-pattern.js praveen');
  console.log('         node scripts/search-users-by-pattern.js kitchen');
  process.exit(1);
}

searchUsers(pattern);
