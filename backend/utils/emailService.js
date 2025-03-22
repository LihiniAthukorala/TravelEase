import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com', // email address
    pass: process.env.SMTP_PASS || 'your-password', // email password or app-specific password
  },
});

/**
 * Send an email using the configured transporter
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 * @returns {Promise} - Resolves with info about the sent email
 */
export const sendEmail = async (to, subject, text, html = '') => {
  try {
    // Validate recipient email
    if (!to || !to.includes('@')) {
      throw new Error('Invalid recipient email address');
    }

    const mailOptions = {
      from: `"Tourism & Travel System" <${process.env.SMTP_USER || 'noreply@example.com'}>`,
      to,
      subject,
      text,
      html: html || text, // Use HTML if provided, otherwise use text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a stock alert email
 * @param {string} to - Recipient email address
 * @param {string} productName - Name of the product with low stock
 * @param {number} quantity - Current quantity
 * @param {string} status - Status (Out of Stock/Low Stock)
 */
export const sendStockAlertEmail = async (to, productName, quantity, status) => {
  const subject = `Stock Alert: ${status} - ${productName}`;
  
  const text = `
    Stock Alert Notification

    Product: ${productName}
    Status: ${status}
    Current Quantity: ${quantity} units

    Please log in to the admin dashboard to reorder this item.
    
    This is an automated message from the Tourism & Travel Management System.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${status === 'Out of Stock' ? '#dc2626' : '#f59e0b'}; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        Stock Alert Notification
      </h2>
      <p>The following item requires your attention:</p>
      <div style="background-color: ${status === 'Out of Stock' ? '#fee2e2' : '#fef3c7'}; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Status:</strong> <span style="color: ${status === 'Out of Stock' ? '#dc2626' : '#b45309'};">${status}</span></p>
        <p><strong>Current Quantity:</strong> ${quantity} units</p>
      </div>
      <p>Please <a href="http://localhost:3000/admin/stock-tracking" style="color: #2563eb;">log in to the admin dashboard</a> to reorder this item.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from the Tourism & Travel Management System.</p>
    </div>
  `;
  
  return sendEmail(to, subject, text, html);
};

/**
 * Send a bulk order confirmation email
 * @param {string} to - Recipient email address
 * @param {object} order - Order details
 */
export const sendOrderConfirmationEmail = async (to, order) => {
  const subject = `Order Confirmation #${order._id}`;
  
  let itemsList = '';
  order.orderedItems.forEach(item => {
    itemsList += `${item.equipment.name}: ${item.quantity} units at LKR ${item.unitPrice} each\n`;
  });
  
  const text = `
    Order Confirmation

    Order #: ${order._id}
    Order Date: ${new Date(order.orderDate).toLocaleDateString()}
    Status: ${order.status}
    Total Amount: LKR ${order.totalAmount.toFixed(2)}
    
    Items:
    ${itemsList}

    This order is currently being processed and you will be notified when it is shipped.
    
    Thank you for your business!
    Tourism & Travel Management System
  `;
  
  // HTML version would be more elaborate with better formatting
  
  return sendEmail(to, subject, text);
};

export default {
  sendEmail,
  sendStockAlertEmail,
  sendOrderConfirmationEmail
};
