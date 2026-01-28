const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * Database Seeder
 * Creates initial data for testing the CRM system
 */

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@travelcrm.com' },
        update: {},
        create: {
            name: 'System Admin',
            email: 'admin@travelcrm.com',
            password: adminPassword,
            role: 'ADMIN'
        }
    });
    console.log('✅ Created admin user:', admin.email);

    // Create Sales user
    const salesPassword = await bcrypt.hash('sales123', 10);
    const sales = await prisma.user.upsert({
        where: { email: 'sales@travelcrm.com' },
        update: {},
        create: {
            name: 'Sales Staff',
            email: 'sales@travelcrm.com',
            password: salesPassword,
            role: 'SALES'
        }
    });
    console.log('✅ Created sales user:', sales.email);

    // Create CS user
    const csPassword = await bcrypt.hash('cs123', 10);
    const cs = await prisma.user.upsert({
        where: { email: 'cs@travelcrm.com' },
        update: {},
        create: {
            name: 'Customer Service',
            email: 'cs@travelcrm.com',
            password: csPassword,
            role: 'CS'
        }
    });
    console.log('✅ Created CS user:', cs.email);

    // Create Manager user
    const managerPassword = await bcrypt.hash('manager123', 10);
    const manager = await prisma.user.upsert({
        where: { email: 'manager@travelcrm.com' },
        update: {},
        create: {
            name: 'Sales Manager',
            email: 'manager@travelcrm.com',
            password: managerPassword,
            role: 'MANAGER'
        }
    });
    console.log('✅ Created manager user:', manager.email);

    // Create sample customers
    const customer1 = await prisma.customer.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+6281234567890',
            address: 'Jakarta, Indonesia',
            status: 'PROSPECT'
        }
    });

    const customer2 = await prisma.customer.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+6287654321098',
            address: 'Bandung, Indonesia',
            status: 'ACTIVE'
        }
    });
    console.log('✅ Created sample customers');

    // Create sample travel packages
    const package1 = await prisma.travelPackage.create({
        data: {
            name: 'Bali Paradise Getaway',
            destination: 'Bali, Indonesia',
            description: 'Experience the beauty of Bali with our 5-day paradise getaway. Includes beach resort stay, temple visits, and cultural experiences.',
            price: 5000000,
            quota: 20,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-03-05'),
            imageUrl: 'https://example.com/bali.jpg'
        }
    });

    const package2 = await prisma.travelPackage.create({
        data: {
            name: 'Yogyakarta Heritage Tour',
            destination: 'Yogyakarta, Indonesia',
            description: 'Discover the rich heritage of Yogyakarta. Visit Borobudur, Prambanan, and experience traditional Javanese culture.',
            price: 3500000,
            quota: 15,
            startDate: new Date('2026-03-15'),
            endDate: new Date('2026-03-18'),
            imageUrl: 'https://example.com/yogya.jpg'
        }
    });

    const package3 = await prisma.travelPackage.create({
        data: {
            name: 'Komodo Adventure',
            destination: 'Labuan Bajo, Indonesia',
            description: 'Adventure awaits in Komodo National Park. See the legendary Komodo dragons and enjoy pristine beaches.',
            price: 8000000,
            quota: 10,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-04-04'),
            imageUrl: 'https://example.com/komodo.jpg'
        }
    });
    console.log('✅ Created sample travel packages');

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Test Credentials:');
    console.log('-------------------');
    console.log('Admin:   admin@travelcrm.com / admin123');
    console.log('Sales:   sales@travelcrm.com / sales123');
    console.log('CS:      cs@travelcrm.com / cs123');
    console.log('Manager: manager@travelcrm.com / manager123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
