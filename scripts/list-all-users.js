#!/usr/bin/env node

/**
 * List all users in the database
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function listAllUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}).toArray();

    console.log(`\n📋 Total Users: ${users.length}\n`);
    console.log('━'.repeat(120));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.personalInfo?.name || 'N/A'} (${user.type || 'N/A'})`);
      console.log(`   Email: ${user.personalInfo?.email || 'N/A'}`);
      console.log(`   StoreId: ${user.employeeDetails?.storeId || 'N/A'} | Active: ${user.isActive} | Role: ${user.employeeDetails?.role || 'N/A'}`);
      console.log(`   ID: ${user._id}`);
      console.log('━'.repeat(120));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

listAllUsers();
