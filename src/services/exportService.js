const excel = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../config/database');
const path = require('path');

/**
 * Export Service
 * Handles generation of reports in Excel and PDF formats
 */

/**
 * Generate Sales Report Excel
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {Promise<excel.Workbook>}
 */
const generateSalesExcel = async (startDate, endDate) => {
    // 1. Fetch data
    const where = {
        status: 'PAID'
    };

    if (startDate && endDate) {
        where.payment = {
            paidAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        };
    }

    const bookings = await prisma.booking.findMany({
        where,
        include: {
            customer: true,
            package: true,
            payment: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 2. Create Workbook
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // 3. Define Columns
    worksheet.columns = [
        { header: 'Booking Code', key: 'bookingCode', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Package', key: 'package', width: 30 },
        { header: 'Participants', key: 'participants', width: 12 },
        { header: 'Total Amount', key: 'amount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        { header: 'Paid At', key: 'paidAt', width: 20 }
    ];

    // Style Header
    worksheet.getRow(1).font = { bold: true };

    // 4. Add Rows
    bookings.forEach(booking => {
        worksheet.addRow({
            bookingCode: booking.bookingCode,
            date: booking.createdAt.toISOString().split('T')[0],
            customer: booking.customer.name,
            package: booking.package.name,
            participants: booking.participants,
            amount: parseFloat(booking.totalAmount),
            paymentMethod: booking.payment?.paymentType || 'N/A',
            paidAt: booking.payment?.paidAt ? booking.payment.paidAt.toISOString().split('T')[0] : 'N/A'
        });
    });

    // Add Total Row
    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    worksheet.addRow([]);
    worksheet.addRow({
        participants: 'Total Revenue:',
        amount: totalRevenue
    });
    worksheet.getRow(worksheet.lastRow.number).font = { bold: true };

    return workbook;
};

/**
 * Generate Invoice PDF
 * @param {number} bookingId 
 * @param {Object} res Response object to pipe PDF to
 */
const generateInvoicePDF = async (bookingId, res) => {
    // 1. Fetch Booking Data
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: {
            customer: true,
            package: true,
            payment: true
        }
    });

    if (!booking) {
        throw new Error('Booking not found');
    }

    // 2. Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Pipe directly to response
    doc.pipe(res);

    // 3. Add Content
    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Company Info
    doc.fontSize(10).text('Travel Company Inc.', { align: 'right' });
    doc.text('123 Travel St, Jakarta', { align: 'right' });
    doc.moveDown();

    // Invoice Details
    doc.fontSize(12).text(`Invoice #: INV-${booking.bookingCode}`);
    doc.text(`Date: ${new Date().toISOString().split('T')[0]}`);
    doc.text(`Status: ${booking.status}`);
    doc.moveDown();

    // Customer Info
    doc.text(`Bill To:`);
    doc.font('Helvetica-Bold').text(booking.customer.name);
    doc.font('Helvetica').text(booking.customer.email);
    doc.text(booking.customer.phone || '');
    if (booking.customer.address) doc.text(booking.customer.address);
    doc.moveDown();

    // Table Header
    const tableTop = 250;
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 90, align: 'right' });
    doc.text('Price', 400, tableTop, { width: 90, align: 'right' });
    doc.text('Total', 500, tableTop, { width: 90, align: 'right' });

    // Table Line
    doc.moveTo(50, tableTop + 15).lineTo(590, tableTop + 15).stroke();

    // Item Row
    const itemTop = tableTop + 30;
    doc.font('Helvetica');
    doc.text(booking.package.name, 50, itemTop);
    doc.text(booking.participants.toString(), 300, itemTop, { width: 90, align: 'right' });
    doc.text(parseFloat(booking.package.price).toLocaleString(), 400, itemTop, { width: 90, align: 'right' });
    doc.text(parseFloat(booking.totalAmount).toLocaleString(), 500, itemTop, { width: 90, align: 'right' });

    // Total Row
    const totalTop = itemTop + 30;
    doc.moveTo(50, totalTop - 10).lineTo(590, totalTop - 10).stroke();
    doc.font('Helvetica-Bold');
    doc.text('Total:', 400, totalTop, { width: 90, align: 'right' });
    doc.text(parseFloat(booking.totalAmount).toLocaleString(), 500, totalTop, { width: 90, align: 'right' });

    // Footer
    doc.fontSize(10).font('Helvetica').text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

    // Finalize
    doc.end();
};

module.exports = {
    generateSalesExcel,
    generateInvoicePDF
};
