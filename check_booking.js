const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.booking.count();
    console.log(`Total Bookings: ${count}`);

    if (count > 0) {
        const lastBooking = await prisma.booking.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
        console.log('Last Booking:', JSON.stringify(lastBooking, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
