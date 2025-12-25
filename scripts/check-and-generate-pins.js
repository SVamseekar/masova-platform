#!/usr/bin/env node

/**
 * Check and Generate PINs for DOM001 and MASOVA-MAIN employees
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/masova';
const DB_NAME = 'masova';
const USER_SERVICE_URL = 'http://localhost:8081';

async function checkAndGeneratePins() {
    let client;

    try {
        console.log('🔄 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Find employees in DOM001 and MASOVA-MAIN
        const employees = await usersCollection.find({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER'] },
            $or: [
                { 'employeeDetails.storeId': 'DOM001' },
                { 'employeeDetails.storeId': 'MASOVA-MAIN' }
            ]
        }).toArray();

        console.log(`📊 Found ${employees.length} employees in DOM001 and MASOVA-MAIN\n`);
        console.log('='.repeat(80));

        for (const employee of employees) {
            const hasPIN = employee.employeeDetails?.employeePINHash ? true : false;
            const hasSuffix = employee.employeeDetails?.pinSuffix ? true : false;

            console.log(`\n👤 Employee: ${employee.personalInfo?.name}`);
            console.log(`   ID: ${employee._id}`);
            console.log(`   Email: ${employee.personalInfo?.email}`);
            console.log(`   Store: ${employee.employeeDetails?.storeId}`);
            console.log(`   Type: ${employee.type}`);
            console.log(`   Has PIN: ${hasPIN ? '✅ Yes' : '❌ No'}`);
            console.log(`   Has Suffix: ${hasSuffix ? '✅ Yes' : '❌ No'}`);

            if (!hasPIN) {
                console.log(`   ⚠️  NEEDS PIN GENERATION`);
            } else if (!hasSuffix) {
                console.log(`   ⚠️  NEEDS PIN REGENERATION (missing suffix)`);
            } else {
                console.log(`   ✅ PIN is properly configured`);
            }
        }

        console.log('\n' + '='.repeat(80));

        // Count employees needing action
        const needsPIN = employees.filter(e => !e.employeeDetails?.employeePINHash);
        const needsSuffix = employees.filter(e =>
            e.employeeDetails?.employeePINHash &&
            (!e.employeeDetails?.pinSuffix || e.employeeDetails.pinSuffix === '')
        );

        console.log(`\n📋 Summary:`);
        console.log(`   Total employees: ${employees.length}`);
        console.log(`   Need PIN generation: ${needsPIN.length}`);
        console.log(`   Need PIN regeneration (suffix): ${needsSuffix.length}`);

        if (needsPIN.length > 0 || needsSuffix.length > 0) {
            console.log(`\n⚠️  ACTION REQUIRED:`);
            console.log(`   Run migration script: node scripts/migrate-pin-suffix.js`);
            console.log(`   This will regenerate PINs for employees missing the suffix optimization.`);
        } else {
            console.log(`\n✅ All employees have properly configured PINs with suffix optimization!`);
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

checkAndGeneratePins().catch(console.error);
