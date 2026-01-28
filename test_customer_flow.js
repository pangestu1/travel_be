const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testCustomerFlow() {
    try {
        console.log('🚀 Starting Customer Flow Test...');

        // 1. Register
        const email = `test${Date.now()}@example.com`;
        console.log(`\n1. Registering customer: ${email}`);
        const registerRes = await axios.post(`${API_URL}/auth/customer/register`, {
            name: 'Test Customer',
            email,
            password: 'password123',
            phone: '08123456789',
            address: 'Test Address'
        });
        console.log('✅ Registration successful');

        // 2. Login
        console.log('\n2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/customer/login`, {
            email,
            password: 'password123'
        });
        console.log('✅ Login successful');
        const token = loginRes.data.token;
        console.log('🔑 Token received');

        // 3. Get Packages
        console.log('\n3. Fetching packages...');
        const packageRes = await axios.get(`${API_URL}/packages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const pkg = packageRes.data.packages[0];
        console.log(`✅ Found package: ${pkg.name} (ID: ${pkg.id})`);

        // 4. Create Booking
        console.log('\n4. Creating booking...');
        const bookingRes = await axios.post(`${API_URL}/bookings`, {
            packageId: pkg.id,
            participants: 2,
            departureDate: new Date().toISOString(),
            notes: 'Test booking'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const booking = bookingRes.data.data;
        console.log(`✅ Booking created! ID: ${booking.id}, Status: ${booking.status}`);

        // 5. Initiate Payment
        console.log('\n5. Initiating payment...');
        const payRes = await axios.post(`${API_URL}/bookings/${booking.id}/pay`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Payment initiated!');
        console.log(`💰 Snap Token: ${payRes.data.data.snapToken}`);

        console.log('\n✨ ALL TESTS PASSED!');
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

testCustomerFlow();
