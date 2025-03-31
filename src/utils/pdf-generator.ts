// utils/pdf-generator.ts
import PDFDocument from 'pdfkit';

export const generatePDF = async ({ order, paymentMethod, amountPaid }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add company logo or header
      doc.fontSize(20).text('Receipt', { align: 'center' });
      doc.moveDown();
      
      // Order information
      doc.fontSize(12).text(`Order #: ${order.id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Branch: ${order.branch.name}`);
      doc.text(`Customer: ${order.user.name}`);
      doc.text(`Phone: ${order.user.phoneNumber}`);
      doc.text(`Email: ${order.user.email}`);
      doc.text(`Shipping Address: ${order.address}`);
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
      doc.text('Price', priceX, tableTop);
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
        doc.text(`$${Number(item.product.price).toFixed(2)}`, priceX, currentY);
        doc.text(`$${(Number(item.product.price) * item.quantity).toFixed(2)}`, amountX, currentY);
        currentY += 20;
      });
      
      // Draw a line
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 20;
      
      // Total
      doc.fontSize(12);
      doc.text(`Total: $${Number(order.netAmount).toFixed(2)}`, amountX, currentY);
      currentY += 20;
      
      // Payment information
      doc.moveDown();
      doc.text(`Payment Method: ${paymentMethod}`);
      doc.text(`Amount Paid: $${amountPaid.toFixed(2)}`);
      
      // Add footer
      const footerTop = doc.page.height - 100;
      doc.fontSize(10).text('Thank you for your purchase!', 50, footerTop, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// utils/whatsapp.ts
import axios from 'axios';

export const sendWhatsAppMessage = async ({ to, message, attachment }) => {
  try {
    // This is a placeholder. In production, you would integrate with a WhatsApp business API
    // such as Twilio, MessageBird, or Meta's WhatsApp Business API
    
    // Example using Twilio (you'd need to replace with your actual implementation)
    /*
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
      mediaUrl: [attachment.url] // In a real implementation, you would first upload the attachment
    });
    */
    
    console.log(`WhatsApp message sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
};