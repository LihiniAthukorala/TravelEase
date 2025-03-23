import mongoose from 'mongoose';
import { sendStockAlertEmail } from './emailService.js';

// Store notification history in memory (could be moved to a database in production)
const notificationHistory = [];

// Send in-app notification (to be stored and retrieved by frontend)
const sendInAppNotification = async (userId, title, message, type, data) => {
  console.log(`[IN-APP NOTIFICATION] User: ${userId}, Title: ${title}, Message: ${message}`);
  
  // In a real system, this would be saved to a database collection
  notificationHistory.push({
    id: Date.now().toString(),
    userId,
    title,
    message,
    type,
    data,
    read: false,
    createdAt: new Date()
  });
  
  return true;
};

/**
 * Send a notification about low stock or out of stock items
 * @param {Object} data - Object containing notification data
 */
export const sendStockNotification = async (data) => {
  try {
    const { type, productName, quantity, ...notificationData } = data;
    
    // In a real app, we would fetch admin users from the database
    // For now, we'll just log the notification
    console.log(`Stock notification: ${type} - ${productName || 'Unknown product'} (${quantity || 0} units)`);
    
    let title, message;
    
    switch (type) {
      case 'low_stock':
        title = 'Low Stock Alert';
        message = `${productName || 'A product'} is running low (${quantity} units remaining)`;
        break;
        
      case 'out_of_stock':
        title = 'Out of Stock Alert';
        message = `${productName || 'A product'} is now out of stock!`;
        break;
        
      case 'order_created':
        title = 'New Stock Order Created';
        message = `Order placed with ${notificationData.supplierName || 'a supplier'} for ${notificationData.itemCount || 'several'} items`;
        break;
        
      case 'auto_reorder':
        title = 'Automatic Reorder Placed';
        message = `System automatically placed an order for low stock items`;
        break;
        
      default:
        title = 'Stock Notification';
        message = 'New stock notification received';
    }
    
    // In a production app, we'd send to all admin users
    // But for now, we'll just print to console
    console.log(`[NOTIFICATION] ${title}: ${message}`);
    
    // If email service is available, try to send an email
    try {
      // In a real app, we'd get admin email from settings/DB
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      
      if (type === 'low_stock' || type === 'out_of_stock') {
        // Only attempt to send email if we have required data
        if (productName && quantity !== undefined) {
          await sendStockAlertEmail(
            adminEmail,
            productName,
            quantity,
            type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'
          );
        }
      }
    } catch (emailError) {
      // Log but don't fail if email sending fails
      console.error('Failed to send email notification:', emailError);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending stock notification:', error);
    return false;
  }
};

// Get notifications for a specific user
export const getUserNotifications = (userId) => {
  return notificationHistory.filter(notification => 
    notification.userId.toString() === userId.toString()
  ).sort((a, b) => b.createdAt - a.createdAt);
};

// Mark notification as read
export const markNotificationAsRead = (notificationId, userId) => {
  const notification = notificationHistory.find(n => 
    n.id === notificationId && n.userId.toString() === userId.toString()
  );
  
  if (notification) {
    notification.read = true;
    return true;
  }
  
  return false;
};

export default {
  sendStockNotification
};
