import StockOrder from '../models/StockOrder.js';
import Supplier from '../models/Supplier.js';
import CampingEquipment from '../models/CampingEquipment.js';
import { sendStockNotification } from '../utils/notificationService.js';

// Create a new stock order
export const createStockOrder = async (req, res) => {
  try {
    // Only admins can create stock orders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create stock orders'
      });
    }

    const { 
      supplierId, 
      orderedItems,
      expectedDeliveryDate,
      trackingInfo,
      isAutoOrder,
      notes
    } = req.body;
    
    // Validate required fields
    if (!supplierId || !orderedItems || orderedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide supplier and at least one item'
      });
    }
    
    // Check if supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Validate and process ordered items
    const processedItems = [];
    
    for (const item of orderedItems) {
      // Check if equipment exists
      const equipment = await CampingEquipment.findById(item.equipmentId);
      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `Equipment with ID ${item.equipmentId} not found`
        });
      }
      
      // Validate quantity
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Please provide a valid quantity for ${equipment.name}`
        });
      }
      
      processedItems.push({
        equipment: item.equipmentId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || equipment.price,
        notes: item.notes
      });
    }
    
    // Create the order
    const order = new StockOrder({
      supplier: supplierId,
      orderedItems: processedItems,
      expectedDeliveryDate,
      trackingInfo,
      isAutoOrder: isAutoOrder || false,
      notes,
      createdBy: req.user._id
    });
    
    await order.save();
    
    // Send notification about the new order
    sendStockNotification({
      type: 'order_created',
      orderId: order._id,
      supplierName: supplier.name,
      itemCount: processedItems.length,
      totalAmount: order.totalAmount,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Stock order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating stock order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock order',
      error: error.message
    });
  }
};

// Get all stock orders
export const getStockOrders = async (req, res) => {
  try {
    // Only admins can view stock orders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view stock orders'
      });
    }

    const { status } = req.query;
    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const orders = await StockOrder.find(query)
      .populate('supplier', 'name email phone')
      .populate('orderedItems.equipment', 'name category')
      .populate('createdBy', 'username email')
      .sort({ orderDate: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching stock orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock orders',
      error: error.message
    });
  }
};

// Get stock order by ID
export const getStockOrderById = async (req, res) => {
  try {
    // Only admins can view stock orders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view stock orders'
      });
    }

    const order = await StockOrder.findById(req.params.id)
      .populate('supplier', 'name email phone address')
      .populate('orderedItems.equipment', 'name category price')
      .populate('createdBy', 'username email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Stock order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching stock order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock order',
      error: error.message
    });
  }
};

// Update stock order status
export const updateStockOrderStatus = async (req, res) => {
  try {
    // Only admins can update stock orders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update stock orders'
      });
    }

    const { status, trackingInfo, deliveryDate } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }
    
    const order = await StockOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Stock order not found'
      });
    }
    
    // Update order fields
    order.status = status;
    
    if (trackingInfo) {
      order.trackingInfo = {
        ...order.trackingInfo,
        ...trackingInfo
      };
    }
    
    if (status === 'delivered') {
      order.deliveryDate = deliveryDate || new Date();
      
      // Update inventory quantities when order is delivered
      for (const item of order.orderedItems) {
        const equipment = await CampingEquipment.findById(item.equipment);
        if (equipment) {
          equipment.quantity += item.quantity;
          await equipment.save();
        }
      }
      
      // Send notification about inventory update
      sendStockNotification({
        type: 'inventory_updated',
        orderId: order._id,
        message: 'Inventory has been updated with delivered items'
      });
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Stock order updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating stock order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock order',
      error: error.message
    });
  }
};

// Cancel stock order
export const cancelStockOrder = async (req, res) => {
  try {
    // Only admins can cancel stock orders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel stock orders'
      });
    }

    const { reason } = req.body;
    
    const order = await StockOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Stock order not found'
      });
    }
    
    // Only allow cancellation of pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status '${order.status}'`
      });
    }
    
    order.status = 'cancelled';
    order.notes = order.notes 
      ? `${order.notes}\n\nCancellation reason: ${reason || 'Not specified'}`
      : `Cancellation reason: ${reason || 'Not specified'}`;
    
    await order.save();
    
    // Send notification about cancellation
    sendStockNotification({
      type: 'order_cancelled',
      orderId: order._id,
      reason: reason || 'Not specified'
    });
    
    res.status(200).json({
      success: true,
      message: 'Stock order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling stock order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel stock order',
      error: error.message
    });
  }
};
