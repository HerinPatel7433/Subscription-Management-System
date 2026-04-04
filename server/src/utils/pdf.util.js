// server/src/utils/pdf.util.js
const PDFDocument = require('pdfkit');

/**
 * Generates an invoice PDF as a buffer
 * @param {Object} invoice - The invoice object containing customer, subscription, and lines
 * @returns {Promise<Buffer>}
 */
function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'right' });
      doc.moveDown();

      // Company Info (Placeholder)
      doc.fontSize(10)
         .text('Subscription Management System', 50, 50)
         .text('123 Billing Street', 50, 65)
         .text('Tech City, TC 12345', 50, 80);

      // Invoice metadata
      doc.text(`Invoice ID: ${invoice.id}`, 50, 110)
         .text(`Status: ${invoice.status.toUpperCase()}`, 50, 125)
         .text(`Issue Date: ${invoice.issuedDate.toISOString().split('T')[0]}`, 50, 140)
         .text(`Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`, 50, 155);

      // Customer Info
      const startX = 350;
      doc.text('Bill To:', startX, 110)
         .text(invoice.customer.name, startX, 125)
         .text(invoice.customer.email, startX, 140);

      doc.moveDown(3);

      // Lines Table Header
      const tableTop = 200;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop)
         .text('Qty', 250, tableTop, { width: 50, align: 'right' })
         .text('Unit Price', 300, tableTop, { width: 70, align: 'right' })
         .text('Tax', 370, tableTop, { width: 50, align: 'right' })
         .text('Discount', 420, tableTop, { width: 60, align: 'right' })
         .text('Line Total', 480, tableTop, { width: 70, align: 'right' });

      // Draw a line
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica');
      let y = tableTop + 25;

      // Lines Array
      if (invoice.lines && invoice.lines.length > 0) {
        invoice.lines.forEach(line => {
          doc.text(line.product.name, 50, y, { width: 190 })
             .text(line.quantity.toString(), 250, y, { width: 50, align: 'right' })
             .text(`$${Number(line.unitPrice).toFixed(2)}`, 300, y, { width: 70, align: 'right' })
             .text(`$${Number(line.taxAmount).toFixed(2)}`, 370, y, { width: 50, align: 'right' })
             .text(`-$${Number(line.discountAmount).toFixed(2)}`, 420, y, { width: 60, align: 'right' })
             .text(`$${Number(line.lineTotal).toFixed(2)}`, 480, y, { width: 70, align: 'right' });
          y += 20;
        });
      }

      // Draw a line above totals
      doc.moveTo(350, y + 10).lineTo(550, y + 10).stroke();
      y += 20;

      // Total
      doc.font('Helvetica-Bold');
      doc.text('Total Amount:', 350, y, { width: 100, align: 'right' });
      doc.text(`$${Number(invoice.totalAmount).toFixed(2)}`, 480, y, { width: 70, align: 'right' });

      // Footer
      doc.font('Helvetica')
         .fontSize(10)
         .text(
           'Payment is due within 15 days. Thank you for your business!',
           50,
           700,
           { align: 'center', width: 500 }
         );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
