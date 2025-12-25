// Test script to create an active working session for testing
const axios = require('axios');

const API_URL = 'http://localhost:8081/api';

async function createTestSession() {
  try {
    console.log('🔍 Creating test active session...\n');

    // First, login as manager to get token
    console.log('1️⃣ Logging in as manager...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@masova.com',
      password: 'Admin@123'
    });

    const token = loginResponse.data.accessToken;
    const managerId = loginResponse.data.user.id;
    const storeId = loginResponse.data.user.storeId;

    console.log(`   ✓ Logged in as: ${loginResponse.data.user.name}`);
    console.log(`   ✓ Manager ID: ${managerId}`);
    console.log(`   ✓ Store ID: ${storeId}\n`);

    // Get list of employees
    console.log('2️⃣ Fetching employees...');
    const employeesResponse = await axios.get(`${API_URL}/users/store/${storeId}/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': managerId,
        'X-User-Type': 'MANAGER',
        'X-User-Store-Id': storeId
      }
    });

    const employees = employeesResponse.data;
    console.log(`   ✓ Found ${employees.length} employees\n`);

    if (employees.length === 0) {
      console.log('❌ No employees found. Please create staff members first.');
      return;
    }

    // Find a staff member (not manager)
    const staffMember = employees.find(e => e.type === 'STAFF' || e.type === 'DRIVER');

    if (!staffMember) {
      console.log('❌ No staff members found. Please create a staff member first.');
      return;
    }

    console.log(`3️⃣ Selected employee: ${staffMember.name}`);
    console.log(`   Employee ID: ${staffMember.id}`);
    console.log(`   Type: ${staffMember.type}\n`);

    // Check if employee has a PIN (they should have from creation)
    console.log('4️⃣ Note: Employee must have a PIN set to clock in.');
    console.log('   If this fails, the employee may not have a PIN configured.\n');

    // Start a session for the employee
    console.log('5️⃣ Starting working session...');
    const sessionResponse = await axios.post(
      `${API_URL}/users/sessions/start`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': staffMember.id,
          'X-User-Type': staffMember.type,
          'X-User-Store-Id': storeId,
          'X-Selected-Store-Id': storeId
        }
      }
    );

    console.log('   ✓ Session created successfully!\n');
    console.log('📊 Session Details:');
    console.log('   ID:', sessionResponse.data.id);
    console.log('   Employee:', staffMember.name);
    console.log('   Store ID:', sessionResponse.data.storeId);
    console.log('   Login Time:', new Date(sessionResponse.data.loginTime).toLocaleString());
    console.log('   Status:', sessionResponse.data.status || 'ACTIVE');
    console.log('   Is Active:', sessionResponse.data.isActive);

    console.log('\n✅ Test session created! Check the Staff Management page to see it.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('\n💡 Tip: Make sure the user service is running on port 8081');
    }
  }
}

createTestSession();
