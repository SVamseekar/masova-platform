#!/usr/bin/env node

/**
 * Delete a user by email - searches all possible email field locations
 * Usage: node scripts/delete-user-by-email.js <email>
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function deleteUserByEmail(email) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Search in multiple possible locations
    const queries = [
      { 'personalInfo.email': email },
      { 'email': email },
      { 'personalInfo.email': { $regex: email, $options: 'i' } }
    ];

    let user = null;
    let matchedQuery = null;

    for (const query of queries) {
      user = await usersCollection.findOne(query);
      if (user) {
        matchedQuery = query;
        break;
      }
    }

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('\nSearched in:');
      console.log('  - personalInfo.email (exact match)');
      console.log('  - email (top level)');
      console.log('  - personalInfo.email (case-insensitive)');

      // List all users to help debug
      const allUsers = await usersCollection.find({}).limit(10).toArray();
      if (allUsers.length > 0) {
        console.log(`\n📋 Found ${allUsers.length} total users in database:`);
        allUsers.forEach(u => {
          console.log(`  - ${u.personalInfo?.name || 'N/A'} (${u.personalInfo?.email || u.email || 'NO EMAIL'})`);
        });
      }
      return;
    }

    console.log('\n📋 User Found (using query:', JSON.stringify(matchedQuery), ')');
    console.log('━'.repeat(60));
    console.log(`ID: ${user._id}`);
    console.log(`Name: ${user.personalInfo?.name || user.name || 'N/A'}`);
    console.log(`Email: ${user.personalInfo?.email || user.email || 'N/A'}`);
    console.log(`Phone: ${user.personalInfo?.phone || user.phone || 'N/A'}`);
    console.log(`Type: ${user.type || 'N/A'}`);
    console.log(`StoreId: ${user.employeeDetails?.storeId || 'N/A'}`);
    console.log(`Role: ${user.employeeDetails?.role || 'N/A'}`);
    console.log(`Active: ${user.isActive}`);
    console.log('━'.repeat(60));

    console.log('\n🗑️  Deleting user...');
    const result = await usersCollection.deleteOne({ _id: user._id });

    if (result.deletedCount === 1) {
      console.log('✅ User deleted successfully!');
      console.log(`\nYou can now create a new user with email: ${email}`);
    } else {
      console.log('❌ Failed to delete user');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/delete-user-by-email.js <email>');
  console.log('Example: node scripts/delete-user-by-email.js praveen.kitchen@masova.com');
  process.exit(1);
}

deleteUserByEmail(email);
