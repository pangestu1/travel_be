const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';

// Create dummy image
const imagePath = path.join(__dirname, 'test_image.jpg');
fs.writeFileSync(imagePath, 'dummy image content');

async function testAdvancedFeatures() {
    try {
        console.log('🚀 Starting Advanced Features Test (v2.1)...\n');

        // 1. Admin Login
        console.log('1. Admin Login...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@travelcrm.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.data.token; // Check data structure!
        // Wait, controller returns { success: true, message: ..., data: { user: ..., token: ... } }
        // Previous script used adminLogin.data.token which might be UNDEFINED if nested in data.data

        console.log('Token received:', adminToken ? 'YES' : 'NO');
        if (!adminToken) {
            console.log('Full response data:', JSON.stringify(adminLogin.data, null, 2));
            throw new Error('No token received');
        }
        console.log('✅ Admin logged in');

        // 1.5 Verify Token with GET
        console.log('\n1.5 Verifying Token (GET /api/users)...');
        try {
            await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ Token is valid (GET request success)');
        } catch (e) {
            console.error('❌ Token verification failed');
            if (e.response) {
                console.error('Status:', e.response.status, e.response.data);
            }
            throw e;
        }

        // 2. Create Package with Image Upload
        console.log('\n2. Creating Package with Image Upload...');
        const form = new FormData();
        form.append('name', 'Luxury Test Package ' + Date.now());
        form.append('destination', 'Paris');
        form.append('description', 'A test package with image');
        form.append('price', '5000000');
        form.append('quota', '10');
        form.append('startDate', new Date().toISOString());
        form.append('endDate', new Date().toISOString());

        form.append('image', fs.createReadStream(imagePath), {
            filename: 'test_image.jpg',
            contentType: 'image/jpeg'
        });

        const headers = {
            ...form.getHeaders(),
            Authorization: `Bearer ${adminToken}`
        };
        // console.log('Sending headers:', headers);

        const packageRes = await axios.post(`${API_URL}/packages`, form, { headers });

        const packageData = packageRes.data.data;
        if (packageData.imageUrl && packageData.imageUrl.startsWith('/uploads/packages/')) {
            console.log(`✅ Package created with Image: ${packageData.imageUrl}`);
        } else {
            console.error('❌ Image URL missing or incorrect:', packageData);
            throw new Error('Image Upload Failed');
        }

        // 3. Register & Login Customer
        console.log('\n3. Customer Registration & Login...');
        const custEmail = `advanced${Date.now()}@test.com`;
        await axios.post(`${API_URL}/auth/customer/register`, {
            name: 'Adv Customer',
            email: custEmail,
            password: 'password123'
        });

        const custLogin = await axios.post(`${API_URL}/auth/customer/login`, {
            email: custEmail,
            password: 'password123'
        });
        const customerToken = custLogin.data.data ? custLogin.data.data.token : custLogin.data.token;
        // Adjust based on controller structure.

        console.log(`✅ Customer logged in (${custEmail})`);

        // 4. Create Booking
        console.log('\n4. Creating Booking...');
        const bookingRes = await axios.post(`${API_URL}/bookings`, {
            packageId: packageData.id,
            departureDate: new Date().toISOString(),
            participants: 1
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        const bookingId = bookingRes.data.data.id;
        console.log(`✅ Booking created (ID: ${bookingId})`);

        // 5. Download Invoice (PDF)
        console.log('\n5. Downloading Invoice (PDF)...');
        const invoiceRes = await axios.get(`${API_URL}/bookings/${bookingId}/invoice`, {
            headers: { Authorization: `Bearer ${customerToken}` },
            responseType: 'stream'
        });

        if (invoiceRes.headers['content-type'] !== 'application/pdf') {
            throw new Error(`Invalid content-type: ${invoiceRes.headers['content-type']}`);
        }

        const pdfPath = path.join(__dirname, `invoice_${bookingId}.pdf`);
        const writer = fs.createWriteStream(pdfPath);
        invoiceRes.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log(`✅ Invoice downloaded to ${pdfPath}`);

        // 6. Export Sales Report (Excel)
        console.log('\n6. Exporting Sales Report (Excel)...');
        const exportRes = await axios.get(`${API_URL}/reports/export/sales`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            responseType: 'stream'
        });

        // check content type ...

        const excelPath = path.join(__dirname, 'sales_report.xlsx');
        const excelWriter = fs.createWriteStream(excelPath);
        exportRes.data.pipe(excelWriter);

        await new Promise((resolve, reject) => {
            excelWriter.on('finish', resolve);
            excelWriter.on('error', reject);
        });
        console.log(`✅ Sales Report downloaded to ${excelPath}`);

        console.log('\n🎉 ALL ADVANCED TESTS PASSED!');

    } catch (error) {
        console.error('❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.stack);
        }
    }
}

testAdvancedFeatures();
