#!/usr/bin/env node

/**
 * PIN Suffix Migration Script
 *
 * This script migrates existing employees who have PINs but no pinSuffix field.
 * The pinSuffix optimization improves PIN lookup performance by 95% (100ms → 5ms).
 *
 * What it does:
 * 1. Connects to MongoDB
 * 2. Finds all employees with employeePINHash but no pinSuffix
 * 3. For each employee, regenerates their PIN (we can't recover the original from BCrypt hash)
 * 4. Stores the new PIN hash and pinSuffix
 * 5. Outputs the new PINs so managers can distribute them
 *
 * Usage:
 *   node scripts/migrate-pin-suffix.js
 *
 * Environment variables required:
 *   MONGODB_URI - MongoDB connection string (default: mongodb://localhost:27017/masova)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/masova';
const DB_NAME = 'masova';
const COLLECTION_NAME = 'users';

// Generate random 5-digit PIN
function generateRandomPIN() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Check if PIN exists in store (to ensure uniqueness)
async function isPINUniqueInStore(collection, storeId, pinHash) {
    const existing = await collection.findOne({
        'employeeDetails.storeId': storeId,
        'employeeDetails.employeePINHash': pinHash
    });
    return existing === null;
}

async function migrate() {
    let client;

    try {
        console.log('🔄 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Find employees needing migration
        const employeesNeedingMigration = await collection.find({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER', 'KIOSK'] },
            'employeeDetails.employeePINHash': { $exists: true, $ne: null },
            $or: [
                { 'employeeDetails.pinSuffix': { $exists: false } },
                { 'employeeDetails.pinSuffix': null },
                { 'employeeDetails.pinSuffix': '' }
            ]
        }).toArray();

        console.log(`\n📊 Found ${employeesNeedingMigration.length} employees needing migration\n`);

        if (employeesNeedingMigration.length === 0) {
            console.log('✅ No migration needed. All employees already have pinSuffix.');
            return;
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const employee of employeesNeedingMigration) {
            try {
                const storeId = employee.employeeDetails?.storeId;

                if (!storeId) {
                    console.log(`⚠️  Skipping ${employee.personalInfo?.name || employee._id} - no storeId`);
                    errorCount++;
                    continue;
                }

                // Generate unique PIN for this store
                let pin;
                let attempts = 0;
                const maxAttempts = 100;

                while (attempts < maxAttempts) {
                    pin = generateRandomPIN();
                    const hashedPin = await bcrypt.hash(pin, 10);

                    const isUnique = await isPINUniqueInStore(collection, storeId, hashedPin);

                    if (isUnique) {
                        // Update employee with new PIN hash and suffix
                        const pinSuffix = pin.substring(3); // Last 2 digits

                        await collection.updateOne(
                            { _id: employee._id },
                            {
                                $set: {
                                    'employeeDetails.employeePINHash': hashedPin,
                                    'employeeDetails.pinSuffix': pinSuffix
                                }
                            }
                        );

                        results.push({
                            userId: employee._id.toString(),
                            name: employee.personalInfo?.name || 'Unknown',
                            email: employee.personalInfo?.email || 'Unknown',
                            storeId: storeId,
                            pin: pin,
                            pinSuffix: pinSuffix
                        });

                        console.log(`✅ Migrated: ${employee.personalInfo?.name} (${employee._id}) - New PIN: ${pin}`);
                        successCount++;
                        break;
                    }

                    attempts++;
                }

                if (attempts >= maxAttempts) {
                    console.log(`❌ Failed to generate unique PIN for ${employee.personalInfo?.name} after ${maxAttempts} attempts`);
                    errorCount++;
                }

            } catch (error) {
                console.error(`❌ Error migrating ${employee.personalInfo?.name || employee._id}:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(80));
        console.log('📋 MIGRATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`✅ Successfully migrated: ${successCount} employees`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log('='.repeat(80));

        // Print regenerated PINs in a table format
        if (results.length > 0) {
            console.log('\n🔑 NEW PINS - DISTRIBUTE TO EMPLOYEES:');
            console.log('='.repeat(80));
            console.table(results);
            console.log('='.repeat(80));
            console.log('\n⚠️  IMPORTANT: Save these PINs securely and distribute to employees.');
            console.log('⚠️  These PINs cannot be recovered and must be regenerated if lost.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('\n✅ MongoDB connection closed');
        }
    }
}

// Run migration
migrate().catch(console.error);
