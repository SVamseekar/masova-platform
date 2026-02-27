#!/bin/bash

echo "🔍 Creating an active working session..."
echo ""

# First, check if we have any staff members
echo "Checking for staff members in the database..."
node -e "
const { MongoClient } = require('mongodb');

async function checkStaff() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('masova_db');

    const users = await db.collection('users').find({
      type: { \$in: ['STAFF', 'DRIVER'] },
      isActive: true
    }).toArray();

    if (users.length === 0) {
      console.log('❌ No active staff members found!');
      console.log('   Please create staff members first via the Staff Management page.');
      process.exit(1);
    }

    console.log('✓ Found', users.length, 'active staff members');
    const staff = users[0];
    console.log('  Using:', staff.personalInfo?.name || 'Unknown');
    console.log('  ID:', staff._id.toString());
    console.log('  Type:', staff.type);

    // Create a working session
    const session = {
      employeeId: staff._id.toString(),
      storeId: staff.storeId || 'DOM001',
      date: new Date().toISOString().split('T')[0],
      loginTime: new Date(),
      breakDurationMinutes: 0,
      isActive: true,
      status: 'ACTIVE',
      notes: 'Test session for debugging'
    };

    await db.collection('working_sessions').insertOne(session);
    console.log('\\n✅ Active session created!');
    console.log('   Session ID:', session._id);
    console.log('   Clock In Time:', session.loginTime.toLocaleString());
    console.log('\\n👉 Refresh the Staff Management page to see it!');

  } finally {
    await client.close();
  }
}

checkStaff().catch(console.error);
"
