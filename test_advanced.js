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
        console.log('🚀 Starting Advanced Features Test...\n');

        // 1. Admin Login
        console.log('1. Admin Login...');
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@travelcrm.com',
            password: 'admin123'
        });
        const adminToken = adminRes.data.token;
        console.log('✅ Admin logged in');

        // 2. Create Package with Image Upload
        console.log('\n2. Creating Package with Image Upload...');
        const form = new FormData();
        form.append('name', 'Luxury Test Package');
        form.append('destination', 'Paris');
        form.append('description', 'A test package with image');
        form.append('price', '5000000');
        form.append('quota', '10');
        form.append('startDate', new Date().toISOString());
        form.append('endDate', new Date().toISOString());
        form.append('image', fs.createReadStream(imagePath));

        const packageRes = await axios.post(`${API_URL}/packages`, form, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                ...form.getHeaders()
            }
        });

        const packageData = packageRes.data.data;
        if (packageData.imageUrl && packageData.imageUrl.startsWith('/uploads/packages/')) {
            console.log(`✅ Package created with Image: ${packageData.imageUrl}`);
        } else {
            console.error('❌ Image URL missing or incorrect:', packageData);
            throw new Error('Image Upload Failed');
        }

        // 3. Customer Login
        console.log('\n3. Customer Login...');
        const customerRes = await axios.post(`${API_URL}/auth/customer/login`, {
            email: 'test1769616385176@example.com', // Use existing customer from previous test
            password: 'password123'
        });
        const customerToken = customerRes.data.token;
        console.log('✅ Customer logged in');

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

        const pdfPath = path.join(__dirname, `invoice_${bookingId}.pdf`);
        const writer = fs.createWriteStream(pdfPath);
        invoiceRes.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log(`✅ Invoice downloaded to ${pdfPath}`);

        // 6. Export Sales Report (Excel) - Admin
        console.log('\n6. Exporting Sales Report (Excel)...');
        const exportRes = await axios.get(`${API_URL}/reports/export/sales`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            responseType: 'stream'
        });

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
            console.error(error.message);
        }
    }
}

testAdvancedFeatures();
