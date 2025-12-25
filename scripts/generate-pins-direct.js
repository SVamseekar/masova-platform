#!/usr/bin/env node

/**
 * Direct PIN Generation for DOM001 Employees
 * Uses MongoDB and BCrypt directly to generate PINs
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/masova_db';
const DB_NAME = 'masova_db';

// Generate random 5-digit PIN
function generateRandomPIN() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

async function generatePins() {
    let client;

    try {
        console.log('🔄 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Find employees without PINs in DOM001
        const employees = await usersCollection.find({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER'] },
            'employeeDetails.storeId': 'DOM001',
            'employeeDetails.employeePINHash': { $exists: false }
        }).toArray();

        console.log(`📊 Found ${employees.length} employees needing PINs\n`);
        console.log('='.repeat(80));

        const results = [];

        for (const employee of employees) {
            const pin = generateRandomPIN();
            const pinHash = await bcrypt.hash(pin, 10);
            const pinSuffix = pin.substring(3); // Last 2 digits

            // Update employee with PIN
            await usersCollection.updateOne(
                { _id: employee._id },
                {
                    $set: {
                        'employeeDetails.employeePINHash': pinHash,
                        'employeeDetails.pinSuffix': pinSuffix
                    }
                }
            );

            console.log(`\n✅ Generated PIN for ${employee.personalInfo.name}`);
            console.log(`   Employee ID: ${employee._id}`);
            console.log(`   Type: ${employee.type}`);
            console.log(`   Store: ${employee.employeeDetails.storeId}`);
            console.log(`   🔑 PIN: ${pin}`);
            console.log(`   Suffix: ${pinSuffix}`);

            results.push({
                id: employee._id.toString(),
                name: employee.personalInfo.name,
                type: employee.type,
                pin: pin,
                pinSuffix: pinSuffix
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n📋 SUMMARY:');
        console.log(`   ✅ Generated ${results.length} PINs`);

        if (results.length > 0) {
            console.log('\n🔑 NEW PINS - SAVE THESE:');
            console.log('='.repeat(80));
            console.table(results);
            console.log('='.repeat(80));
            console.log('\n⚠️  IMPORTANT: Save these PINs - they cannot be recovered!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('\n✅ MongoDB connection closed');
        }
    }
}

generatePins().catch(console.error);
