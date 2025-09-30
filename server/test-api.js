const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAPI() {
    console.log('🧪 Testing EventGenie Backend API...\n');

    try {
        // Test 1: Check if server is running
        console.log('1. Testing server connection...');
        const response = await axios.get('http://localhost:5001');
        console.log('✅ Server is running:', response.data);
        console.log('');

        // Test 2: Get all services
        console.log('2. Testing GET /api/services...');
        const servicesResponse = await axios.get(`${BASE_URL}/services`);
        console.log('✅ Services endpoint working. Found', servicesResponse.data.length, 'services');
        console.log('');

        // Test 3: Create a test vendor
        console.log('3. Testing vendor registration...');
        const vendorData = {
            username: 'testvendor',
            password: 'testpass123',
            name: 'Test Vendor',
            businessName: 'Test Business',
            email: 'test@vendor.com',
            phone: '1234567890',
            about: 'Test vendor for API testing',
            categories: ['venue', 'catering']
        };

        try {
            const vendorResponse = await axios.post(`${BASE_URL}/vendors/register`, vendorData);
            console.log('✅ Vendor registered successfully:', vendorResponse.data.message);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('ℹ️ Vendor already exists (expected for repeated tests)');
            } else {
                console.log('❌ Vendor registration failed:', error.response?.data?.message || error.message);
            }
        }
        console.log('');

        // Test 4: Create a test customer
        console.log('4. Testing customer registration...');
        const customerData = {
            username: 'testcustomer',
            password: 'testpass123',
            name: 'Test Customer',
            email: 'test@customer.com',
            phone: '1234567890',
            address: '123 Test St, Test City'
        };

        try {
            const customerResponse = await axios.post(`${BASE_URL}/customers/register`, customerData);
            console.log('✅ Customer registered successfully:', customerResponse.data.message);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('ℹ️ Customer already exists (expected for repeated tests)');
            } else {
                console.log('❌ Customer registration failed:', error.response?.data?.message || error.message);
            }
        }
        console.log('');

        // Test 5: Test vendor login
        console.log('5. Testing vendor login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/vendors/login`, {
                username: 'testvendor',
                password: 'testpass123'
            });
            console.log('✅ Vendor login successful:', loginResponse.data.message);
        } catch (error) {
            console.log('❌ Vendor login failed:', error.response?.data?.message || error.message);
        }
        console.log('');

        console.log('🎉 API testing completed!');
        console.log('\n📝 Note: Some tests may show "already exists" messages when run multiple times, which is expected behavior.');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the server is running on http://localhost:5001');
            console.log('💡 Make sure MongoDB is running on mongodb://localhost:27017');
        }
    }
}

testAPI(); 