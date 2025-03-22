import mongoose from 'mongoose';
import User from '../models/User.js';
import { sendStockAlertEmail } from './emailService.js';

// Store notification history in memory (could be moved to a database in production)
const notificationHistory = [];

// Send in-app notification (to be stored and retrieved by frontend)
const sendInAppNotification = async (userId, title, message, type, data) => {
  console.log(`[IN-APP NOTIFICATION] User: ${userId}, Title: ${title}, Message: ${message}`);
  
  // In a real system, this would be saved to a database collection
  notificationHistory.push({
    id: new mongoose.Types.ObjectId().toString(),
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

// Send stock notification based on type
export const sendStockNotification = async (data) => {
  try {
    const { type, ...notificationData } = data;
    
    // Get admin users who should receive stock notifications
    const admins = await User.find({ 
      role: 'admin',
      // In a real system, you might have a stockNotifications preference field
      // stockNotificationsEnabled: true
    });
    
    let title, message;
    
    switch (type) {
      case 'low_stock':
        title = 'Low Stock Alert';
        message = `${notificationData.productName} is running low (${notificationData.quantity} units remaining)`;
        break;
        
      case 'out_of_stock':
        title = 'Out of Stock Alert';
        message = `${notificationData.productName} is now out of stock!`;
        break;
        
      case 'order_created':
        title = 'New Stock Order Created';
        message = `Order placed with ${notificationData.supplierName} for ${notificationData.itemCount} items`;
        break;
        
      case 'order_updated':
        title = 'Stock Order Updated';
        message = `Order #${notificationData.orderId} status updated to ${notificationData.status}`;
        break;
        
      case 'order_cancelled':
        title = 'Stock Order Cancelled';
        message = `Order #${notificationData.orderId} has been cancelled`;
        break;
        
      case 'inventory_updated':
        title = 'Inventory Updated';
        message = `Inventory has been updated with new stock`;
        break;
        
      case 'auto_reorder':
        title = 'Automatic Reorder Placed';
        message = `System automatically placed an order for ${notificationData.items.length} low stock items`;
        break;
        
      default:
        title = 'Stock Notification';
        message = 'New stock notification received';
    }
    
    // Send notifications to all admins
    for (const admin of admins) {
      // Send in-app notification
      await sendInAppNotification(
        admin._id,
        title,
        message,
        type,
        notificationData
      );
      
      // Send email for critical notifications
      if (['out_of_stock', 'low_stock', 'auto_reorder'].includes(type)) {
        try {
          if (type === 'low_stock' || type === 'out_of_stock') {
            await sendStockAlertEmail(
              admin.email,
              notificationData.productName,
              notificationData.quantity,
              type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'
            );
          } else {
            // For auto-reorder, use standard email for now
            // In real app, would have a specific template
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
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
