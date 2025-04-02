import PDFDocument from 'pdfkit';
import axios from 'axios';

export const generatePDF = async ({ order, paymentMethod, amountPaid }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // First, fetch the image from the URL
      const imageResponse = await axios.get('https://res.cloudinary.com/denrbjwcf/image/upload/v1743585717/logo_rlkxk2.png', {
        responseType: 'arraybuffer'
      });
      
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');
      
      // Now create the PDF
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add the logo using the buffer
      doc.image(imageBuffer, 50, 50, { width: 75 });
      
      // Move down to create space after logo
      doc.moveDown(4);
      
      // Add receipt title
      doc.fontSize(20).text('', { align: 'center' });
      doc.moveDown();
      
      // Order information
      doc.fontSize(10).text(`Order ID: ${order.id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Branch: ${order.branch.name}`);
      doc.text(`Customer: ${order.user.name}`);
      doc.text(`Phone: ${order.user.phoneNumber}`);
      doc.moveDown();
      
      // Table header
      doc.fontSize(10);
      const tableTop = doc.y;
      const itemX = 50;
      const quantityX = 300;
      const priceX = 370;
      const amountX = 450;
      
      doc.text('Item', itemX, tableTop);
      doc.text('Qty', quantityX, tableTop);
      doc.text('Unit Price', priceX, tableTop);
      doc.text('Amount', amountX, tableTop);
      
      // Draw a line
      doc.moveDown();
      const lineY = doc.y;
      doc.moveTo(50, lineY).lineTo(550, lineY).stroke();
      doc.moveDown();
      
      // Table rows
      let currentY = doc.y;
      
      order.products.forEach(item => {
        doc.text(item.product.name, itemX, currentY);
        doc.text(item.quantity.toString(), quantityX, currentY);
        doc.text(`Rs.${Number(item.product.price).toFixed(2)}`, priceX, currentY);
        doc.text(`Rs.${(Number(item.product.price) * item.quantity).toFixed(2)}`, amountX, currentY);
        currentY += 20;
      });
      
      // Draw a line
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 20;
      
      // Calculate subtotal from items if not provided in order
      const subtotal = order.subtotalAmount || order.products.reduce((total, item) => {
        return total + (Number(item.product.price) * item.quantity);
      }, 0);
      
      // Show price calculations
      doc.fontSize(10);
      
      // Define the label column X position for consistent alignment
      const labelX = 350;
      
      // Subtotal
      doc.text('Subtotal:', labelX, currentY);
      doc.text(`Rs.${Number(subtotal).toFixed(2)}`, amountX, currentY);
      currentY += 20;
      
      // Discount (only show if there is a discount)
      if (order.discountPercentage && order.discountPercentage > 0) {
        const discountAmount = order.discountAmount || (subtotal * (order.discountPercentage / 100));
        
        doc.text(`Discount (${order.discountPercentage}%):`, labelX, currentY);
        doc.text(`- Rs.${Number(discountAmount).toFixed(2)}`, amountX, currentY);
        currentY += 20;
      }
      
      // Total
      doc.font('Helvetica-Bold');
      doc.text('Total:', labelX, currentY);
      doc.text(`Rs.${Number(order.netAmount).toFixed(2)}`, amountX, currentY);
      doc.font('Helvetica');
      currentY += 30;
      
      // Payment information - now with consistent alignment
      doc.text('Payment Method:', labelX, currentY);
      doc.text(`${paymentMethod}`, amountX, currentY);
      currentY += 20;
      
      doc.text('Amount Paid:', labelX, currentY);
      doc.text(`Rs.${Number(amountPaid).toFixed(2)}`, amountX, currentY);
      currentY += 20;
      
      // Calculate change/balance
      const change = Number(amountPaid) - Number(order.netAmount);
      if (change >= 0) {
        doc.text('Change:', labelX, currentY);
        doc.text(`Rs.${change.toFixed(2)}`, amountX, currentY);
      } else {
        doc.text('Balance Due:', labelX, currentY);
        doc.text(`Rs.${Math.abs(change).toFixed(2)}`, amountX, currentY);
      }
      
      // Add footer
      const footerTop = doc.page.height - 100;
      doc.fontSize(10).text('Thank you for your purchase!', 50, footerTop, { align: 'center' });
      
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};