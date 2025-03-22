import CampingEquipment from '../models/CampingEquipment.js';
import ReorderConfig from '../models/ReorderConfig.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { sendStockNotification } from '../utils/notificationService.js';
import { sendStockAlertEmail } from '../utils/emailService.js';

/**
 * Check inventory levels and trigger alerts for low stock items
 */
export const checkInventoryLevels = async () => {
  try {
    console.log('Running inventory level check...');
    
    // Get all equipment items
    const allEquipment = await CampingEquipment.find();
    
    // Get all reorder configs to determine thresholds
    const reorderConfigs = await ReorderConfig.find();
    const configMap = {};
    reorderConfigs.forEach(config => {
      configMap[config.equipment.toString()] = config;
    });
    
    // Default threshold if not configured
    const DEFAULT_THRESHOLD = 5;
    
    // Track low stock items
    const lowStockItems = [];
    const outOfStockItems = [];
    
    // Check each item's stock level
    for (const item of allEquipment) {
      const itemId = item._id.toString();
      const config = configMap[itemId];
      const threshold = config ? config.threshold : DEFAULT_THRESHOLD;
      
      // Check if item is below threshold or out of stock
      if (item.quantity === 0) {
        outOfStockItems.push({
          id: itemId,
          name: item.name,
          quantity: item.quantity,
          threshold,
          autoReorderEnabled: config ? config.autoReorderEnabled : false,
          preferredSupplier: config ? config.preferredSupplier : null,
          reorderQuantity: config ? config.reorderQuantity : 10
        });
      } else if (item.quantity < threshold) {
        lowStockItems.push({
          id: itemId,
          name: item.name,
          quantity: item.quantity,
          threshold,
          autoReorderEnabled: config ? config.autoReorderEnabled : false,
          preferredSupplier: config ? config.preferredSupplier : null,
          reorderQuantity: config ? config.reorderQuantity : 10
        });
      }
    }
    
    // Send notifications for out of stock items
    if (outOfStockItems.length > 0) {
      await sendAlerts(outOfStockItems, 'Out of Stock');
    }
    
    // Send notifications for low stock items
    if (lowStockItems.length > 0) {
      await sendAlerts(lowStockItems, 'Low Stock');
    }
    
    // Process automatic reorders if enabled
    await processAutoReorders([...outOfStockItems, ...lowStockItems]);
    
    console.log(`Inventory check complete. Found ${outOfStockItems.length} out of stock items and ${lowStockItems.length} low stock items.`);
    
    return {
      outOfStockItems,
      lowStockItems
    };
  } catch (error) {
    console.error('Error checking inventory levels:', error);
    throw error;
  }
};

/**
 * Send alerts for low stock items
 * @param {Array} items - List of items that need alerts
 * @param {String} status - Status (Out of Stock/Low Stock)
 */
async function sendAlerts(items, status) {
  try {
    // Find admin users
    const admins = await User.find({ role: 'admin' });
    
    // Find subscribed customers
    const subscribedCustomers = await Customer.find({ isSubscribedToAlerts: true });
    
    for (const item of items) {
      // Send in-app notifications to admins
      for (const admin of admins) {
        await sendStockNotification({
          type: status === 'Out of Stock' ? 'out_of_stock' : 'low_stock',
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          threshold: item.threshold
        });
        
        // Send email alerts to admins
        if (admin.email) {
          try {
            await sendStockAlertEmail(
              admin.email,
              item.name,
              item.quantity,
              status
            );
          } catch (emailError) {
            console.error(`Failed to send email alert to admin ${admin._id}:`, emailError);
          }
        }
      }
      
      // Send email alerts to subscribed customers
      for (const customer of subscribedCustomers) {
        try {
          await sendStockAlertEmail(
            customer.email,
            item.name,
            item.quantity,
            status
          );
        } catch (emailError) {
          console.error(`Failed to send email alert to customer ${customer._id}:`, emailError);
        }
      }
    }
  } catch (error) {
    console.error('Error sending stock alerts:', error);
    throw error;
  }
}

/**
 * Process automatic reorders for items configured for auto-reordering
 * @param {Array} items - List of items to check for auto-reordering
 */
async function processAutoReorders(items) {
  try {
    const autoReorderItems = items.filter(item => item.autoReorderEnabled && item.preferredSupplier);
    
    if (autoReorderItems.length === 0) {
      return;
    }
    
    console.log(`Processing automatic reorders for ${autoReorderItems.length} items...`);
    
    // Group items by supplier to create consolidated orders
    const supplierOrders = {};
    
    for (const item of autoReorderItems) {
      const supplierId = item.preferredSupplier.toString();
      
      if (!supplierOrders[supplierId]) {
        supplierOrders[supplierId] = [];
      }
      
      supplierOrders[supplierId].push({
        equipmentId: item.id,
        quantity: item.reorderQuantity
      });
    }
    
    // Create orders for each supplier
    for (const [supplierId, items] of Object.entries(supplierOrders)) {
      // Note: In a real implementation, you would create an actual order in the database
      // using the stockOrderController's createStockOrder function
      console.log(`Auto-reorder for supplier ${supplierId}:`, items);
      
      // Mock notification - in a real app you'd create the actual order
      await sendStockNotification({
        type: 'auto_reorder',
        supplierId,
        items: items.map(i => ({ id: i.equipmentId, quantity: i.quantity })),
        timestamp: new Date()
      });
    }
    
    console.log('Automatic reorders processed successfully');
  } catch (error) {
    console.error('Error processing automatic reorders:', error);
    throw error;
  }
}

export default {
  checkInventoryLevels
};
