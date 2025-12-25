#!/usr/bin/env node

/**
 * PIN Lookup Performance Test Script
 *
 * This script tests the performance improvement of the pinSuffix optimization.
 * It simulates PIN lookups with and without the suffix optimization.
 *
 * Expected results:
 * - Without optimization (O(n)): ~100ms for 100 employees (BCrypt check all)
 * - With optimization (O(1)): ~5ms (Index lookup + 1-2 BCrypt checks)
 * - Performance improvement: ~95% faster
 *
 * Usage:
 *   node scripts/test-pin-lookup-performance.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/masova';
const DB_NAME = 'masova';
const COLLECTION_NAME = 'users';

async function testPerformance() {
    let client;

    try {
        console.log('🔄 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Get a sample employee with PIN
        const sampleEmployee = await collection.findOne({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER'] },
            'employeeDetails.employeePINHash': { $exists: true, $ne: null },
            'employeeDetails.pinSuffix': { $exists: true, $ne: null }
        });

        if (!sampleEmployee) {
            console.log('❌ No employees with PINs found. Please create some employees first.');
            return;
        }

        console.log('📊 Test Setup:');
        console.log(`   Employee: ${sampleEmployee.personalInfo?.name}`);
        console.log(`   Store: ${sampleEmployee.employeeDetails?.storeId}`);
        console.log(`   PIN Suffix: ${sampleEmployee.employeeDetails?.pinSuffix}\n`);

        // Count total employees in system
        const totalEmployees = await collection.countDocuments({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER'] }
        });

        console.log(`   Total employees: ${totalEmployees}\n`);

        // We can't test with real PIN since we don't know it (hashed)
        // But we can test the query performance
        const testPinSuffix = sampleEmployee.employeeDetails.pinSuffix;

        // ========================================
        // TEST 1: Optimized lookup (with pinSuffix index)
        // ========================================
        console.log('🚀 TEST 1: Optimized Lookup (with pinSuffix index)');
        console.log('─'.repeat(60));

        const startOptimized = Date.now();

        const candidatesOptimized = await collection.find({
            'employeeDetails.pinSuffix': testPinSuffix
        }).toArray();

        const endOptimized = Date.now();
        const timeOptimized = endOptimized - startOptimized;

        console.log(`   Query time: ${timeOptimized}ms`);
        console.log(`   Candidates found: ${candidatesOptimized.length}`);
        console.log(`   BCrypt checks needed: ${candidatesOptimized.length}`);
        console.log(`   Estimated total time: ${timeOptimized + (candidatesOptimized.length * 2)}ms`);

        // ========================================
        // TEST 2: Unoptimized lookup (without pinSuffix)
        // ========================================
        console.log('\n🐌 TEST 2: Unoptimized Lookup (O(n) scan)');
        console.log('─'.repeat(60));

        const startUnoptimized = Date.now();

        const allEmployees = await collection.find({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER'] }
        }).toArray();

        const endUnoptimized = Date.now();
        const timeUnoptimized = endUnoptimized - startUnoptimized;

        console.log(`   Query time: ${timeUnoptimized}ms`);
        console.log(`   Candidates found: ${allEmployees.length}`);
        console.log(`   BCrypt checks needed: ${allEmployees.length}`);
        console.log(`   Estimated total time: ${timeUnoptimized + (allEmployees.length * 2)}ms`);

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(60));
        console.log('📈 PERFORMANCE COMPARISON');
        console.log('='.repeat(60));

        const estimatedOptimized = timeOptimized + (candidatesOptimized.length * 2);
        const estimatedUnoptimized = timeUnoptimized + (allEmployees.length * 2);
        const improvement = ((estimatedUnoptimized - estimatedOptimized) / estimatedUnoptimized * 100).toFixed(1);
        const speedup = (estimatedUnoptimized / estimatedOptimized).toFixed(1);

        console.log(`   Optimized lookup:   ${estimatedOptimized}ms (${candidatesOptimized.length} BCrypt checks)`);
        console.log(`   Unoptimized lookup: ${estimatedUnoptimized}ms (${allEmployees.length} BCrypt checks)`);
        console.log(`   Improvement:        ${improvement}% faster`);
        console.log(`   Speedup:            ${speedup}x`);
        console.log('='.repeat(60));

        console.log('\n✅ Performance test completed!');

        // Check if all employees have pinSuffix
        const employeesWithoutSuffix = await collection.countDocuments({
            type: { $in: ['STAFF', 'DRIVER', 'MANAGER', 'ASSISTANT_MANAGER'] },
            'employeeDetails.employeePINHash': { $exists: true, $ne: null },
            $or: [
                { 'employeeDetails.pinSuffix': { $exists: false } },
                { 'employeeDetails.pinSuffix': null },
                { 'employeeDetails.pinSuffix': '' }
            ]
        });

        if (employeesWithoutSuffix > 0) {
            console.log(`\n⚠️  WARNING: ${employeesWithoutSuffix} employees have PINs but no pinSuffix!`);
            console.log('   Run: node scripts/migrate-pin-suffix.js');
        } else {
            console.log('\n✅ All employees have pinSuffix - optimization is active!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('\n✅ MongoDB connection closed');
        }
    }
}

// Run test
testPerformance().catch(console.error);
