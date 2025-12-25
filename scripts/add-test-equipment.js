#!/usr/bin/env node

/**
 * Script to add test kitchen equipment to a store
 * Usage: node scripts/add-test-equipment.js <storeId> <token>
 */

const https = require('https');

const args = process.argv.slice(2);
const storeId = args[0] || 'DOM001';
const token = args[1];

if (!token) {
  console.error('Usage: node scripts/add-test-equipment.js <storeId> <token>');
  console.error('Please provide an authentication token');
  process.exit(1);
}

const baseUrl = 'http://localhost:8080';

// Sample equipment to create
const equipmentList = [
  {
    storeId: storeId,
    equipmentName: 'Main Pizza Oven',
    type: 'OVEN',
    status: 'AVAILABLE',
    temperature: 220,
    isOn: true,
    usageCount: 0,
  },
  {
    storeId: storeId,
    equipmentName: 'Commercial Stove #1',
    type: 'STOVE',
    status: 'IN_USE',
    temperature: 180,
    isOn: true,
    usageCount: 5,
  },
  {
    storeId: storeId,
    equipmentName: 'Grill Station',
    type: 'GRILL',
    status: 'AVAILABLE',
    temperature: 200,
    isOn: false,
    usageCount: 2,
  },
  {
    storeId: storeId,
    equipmentName: 'Deep Fryer',
    type: 'FRYER',
    status: 'MAINTENANCE',
    temperature: 175,
    isOn: false,
    usageCount: 8,
    statusNotes: 'Oil needs changing',
  },
  {
    storeId: storeId,
    equipmentName: 'Walk-in Refrigerator',
    type: 'REFRIGERATOR',
    status: 'AVAILABLE',
    temperature: 4,
    isOn: true,
    usageCount: 0,
  },
  {
    storeId: storeId,
    equipmentName: 'Freezer Unit',
    type: 'FREEZER',
    status: 'AVAILABLE',
    temperature: -18,
    isOn: true,
    usageCount: 0,
  },
  {
    storeId: storeId,
    equipmentName: 'Industrial Mixer',
    type: 'MIXER',
    status: 'AVAILABLE',
    isOn: false,
    usageCount: 3,
  },
  {
    storeId: storeId,
    equipmentName: 'Dishwasher',
    type: 'DISHWASHER',
    status: 'IN_USE',
    isOn: true,
    usageCount: 12,
  },
  {
    storeId: storeId,
    equipmentName: 'Backup Oven',
    type: 'OVEN',
    status: 'BROKEN',
    temperature: 0,
    isOn: false,
    usageCount: 0,
    statusNotes: 'Heating element damaged',
  },
];

async function createEquipment(equipment) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(equipment);

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/kitchen-equipment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`,
        'X-Store-Id': storeId,
      },
    };

    const req = require('http').request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`Creating ${equipmentList.length} test equipment items for store ${storeId}...`);

  for (const equipment of equipmentList) {
    try {
      const result = await createEquipment(equipment);
      console.log(`✓ Created: ${equipment.equipmentName} (${equipment.type}) - ${equipment.status}`);
    } catch (error) {
      console.error(`✗ Failed to create ${equipment.equipmentName}:`, error.message);
    }
  }

  console.log('\nDone! Equipment creation complete.');
}

main().catch(console.error);
