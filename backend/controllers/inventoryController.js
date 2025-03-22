import CampingEquipment from '../models/CampingEquipment.js';
import InventoryAuditLog from '../models/InventoryAuditLog.js';
import mongoose from 'mongoose';
import { sendStockNotification } from '../utils/notificationService.js';
import Payment from '../models/Payment.js';
import Rental from '../models/Rental.js';

// Batch update inventory
export const batchUpdateInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Only admins can batch update inventory
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update inventory'
      });
    }
    
    const { updates, reason } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be a non-empty array of inventory changes'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for the inventory update'
      });
    }
    
    const results = [];
    const logs = [];
    const alerts = [];
    
    // Process each update
    for (const update of updates) {
      const { equipmentId, quantityChange, newStatus } = update;
      
      // Validate required fields for each update
      if (!equipmentId) {
        results.push({
          success: false,
          equipmentId: update.equipmentId || 'unknown',
          message: 'Equipment ID is required'
        });
        continue;
      }
      
      // Find the equipment
      const equipment = await CampingEquipment.findById(equipmentId).session(session);
      
      if (!equipment) {
        results.push({
          success: false,
          equipmentId,
          message: 'Equipment not found'
        });
        continue;
      }
      
      // Apply changes
      const oldQuantity = equipment.quantity;
      const oldStatus = equipment.status;
      
      // Update quantity if specified
      if (quantityChange !== undefined) {
        const newQuantity = oldQuantity + quantityChange;
        
        if (newQuantity < 0) {
          results.push({
            success: false,
            equipmentId,
            name: equipment.name,
            message: `Cannot reduce quantity below zero. Current: ${oldQuantity}, Change: ${quantityChange}`
          });
          continue;
        }
        
        equipment.quantity = newQuantity;
        
        // Check if we need to generate low stock alerts
        if (equipment.quantity === 0) {
          alerts.push({
            type: 'out_of_stock',
            productId: equipment._id,
            productName: equipment.name,
            quantity: 0
          });
        } else {
          // Get threshold from reorder config or use default (5)
          const threshold = 5; // Simplified - in real app would fetch from reorder config
          if (equipment.quantity <= threshold) {
            alerts.push({
              type: 'low_stock',
              productId: equipment._id,
              productName: equipment.name,
              quantity: equipment.quantity,
              threshold
            });
          }
        }
      }
      
      // Update status if specified
      if (newStatus) {
        equipment.status = newStatus;
      }
      
      // Save the equipment
      await equipment.save({ session });
      
      // Create audit log
      const log = new InventoryAuditLog({
        equipment: equipmentId,
        actionType: quantityChange !== undefined ? 
          (quantityChange > 0 ? 'stock-in' : 'stock-out') : 'update',
        quantityBefore: oldQuantity,
        quantityAfter: equipment.quantity,
        statusBefore: oldStatus,
        statusAfter: equipment.status,
        reference: update.reference || null,
        reason,
        performedBy: req.user._id,
        notes: update.notes || null
      });
      
      await log.save({ session });
      logs.push(log);
      
      // Add to results
      results.push({
        success: true,
        equipmentId,
        name: equipment.name,
        oldQuantity,
        newQuantity: equipment.quantity,
        oldStatus,
        newStatus: equipment.status
      });
    }
    
    // Check if all operations failed
    if (results.every(result => !result.success)) {
      await session.abortTransaction();
      session.endSession();
      
      return res.status(400).json({
        success: false,
        message: 'All inventory updates failed',
        results
      });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Send notifications for any alerts
    for (const alert of alerts) {
      sendStockNotification(alert);
    }
    
    res.status(200).json({
      success: true,
      message: 'Inventory batch update completed',
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
};

// Generate inventory report
export const generateInventoryReport = async (req, res) => {
  try {
    // Only admins can generate inventory reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate inventory reports'
      });
    }
    
    const { category, status, condition } = req.query;
    let query = {};
    
    // Apply filters if provided
    if (category) query.category = category;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    
    // Get all equipment matching the query
    const equipment = await CampingEquipment.find(query);
    
    // Generate summary statistics
    const totalItems = equipment.length;
    let totalQuantity = 0;
    let totalValue = 0;
    const categorySummary = {};
    const statusSummary = {};
    const conditionSummary = {};
    
    equipment.forEach(item => {
      totalQuantity += item.quantity;
      totalValue += item.price * item.quantity;
      
      // Category summary
      if (!categorySummary[item.category]) {
        categorySummary[item.category] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      categorySummary[item.category].count++;
      categorySummary[item.category].quantity += item.quantity;
      categorySummary[item.category].value += item.price * item.quantity;
      
      // Status summary
      if (!statusSummary[item.status]) {
        statusSummary[item.status] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      statusSummary[item.status].count++;
      statusSummary[item.status].quantity += item.quantity;
      statusSummary[item.status].value += item.price * item.quantity;
      
      // Condition summary
      if (!conditionSummary[item.condition]) {
        conditionSummary[item.condition] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      conditionSummary[item.condition].count++;
      conditionSummary[item.condition].quantity += item.quantity;
      conditionSummary[item.condition].value += item.price * item.quantity;
    });
    
    res.status(200).json({
      success: true,
      report: {
        generatedAt: new Date(),
        totalItems,
        totalQuantity,
        totalValue,
        categorySummary,
        statusSummary,
        conditionSummary,
        items: equipment.map(item => ({
          id: item._id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          value: item.price * item.quantity,
          status: item.status,
          condition: item.condition,
          lastMaintenance: item.lastMaintenance,
          nextMaintenanceScheduled: item.nextMaintenanceScheduled
        }))
      }
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: error.message
    });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    // Only admins can view inventory statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view inventory statistics'
      });
    }
    
    // Overall stats
    const totalEquipment = await CampingEquipment.countDocuments();
    const totalValue = await CampingEquipment.aggregate([
      {
        $project: {
          value: { $multiply: ['$price', '$quantity'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$value' }
        }
      }
    ]);
    
    // Status stats
    const statusStats = await CampingEquipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          value: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);
    
    // Category stats
    const categoryStats = await CampingEquipment.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          value: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);
    
    // Condition stats
    const conditionStats = await CampingEquipment.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          value: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);
    
    // Low stock items
    const lowStockItems = await CampingEquipment.find({ quantity: { $lt: 5 } })
      .select('name category quantity price status');
    
    // Maintenance due items
    const now = new Date();
    const maintenanceDueItems = await CampingEquipment.find({
      nextMaintenanceScheduled: { $lte: now }
    }).select('name category nextMaintenanceScheduled status');
    
    res.status(200).json({
      success: true,
      stats: {
        totalEquipment,
        totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
        statusBreakdown: statusStats,
        categoryBreakdown: categoryStats,
        conditionBreakdown: conditionStats,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        maintenanceDueCount: maintenanceDueItems.length,
        maintenanceDueItems
      }
    });
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory statistics',
      error: error.message
    });
  }
};

// Get trending products (high-demand)
export const getTrendingProducts = async (req, res) => {
  try {
    // Only admins can view trending products
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view trending products data'
      });
    }
    
    const { category, startDate, endDate } = req.query;
    let query = {};
    
    // Apply filters if provided
    if (category && category !== 'all') {
      query['items.equipmentId.category'] = category;
    }
    
    // Date filter for payments
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) {
        dateFilter['$gte'] = new Date(startDate);
      }
      if (endDate) {
        dateFilter['$lte'] = new Date(endDate);
      }
      query.timestamp = dateFilter;
    }
    
    // Get completed rentals and calculate rental frequency by product
    // Using aggregation to get the most rented items
    const rentalData = await Payment.aggregate([
      // Match approved payments with cart type (rental payments)
      { $match: { status: 'approved', type: 'cart', ...(Object.keys(query).length > 0 ? query : {}) } },
      // Unwind the items array to work with individual items
      { $unwind: '$items' },
      // Lookup to get equipment details
      { $lookup: {
          from: 'campingequipments',
          localField: 'items.equipmentId',
          foreignField: '_id',
          as: 'equipment'
        }
      },
      // Unwind the equipment array
      { $unwind: '$equipment' },
      // Filter by category if specified
      ...(category && category !== 'all' ? [{ $match: { 'equipment.category': category } }] : []),
      // Group by equipment ID and calculate metrics
      { $group: {
          _id: '$equipment._id',
          name: { $first: '$equipment.name' },
          category: { $first: '$equipment.category' },
          rentCount: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      // Sort by rental count descending
      { $sort: { rentCount: -1 } },
      // Limit to top 10
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      trendingProducts: rentalData
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products data',
      error: error.message
    });
  }
};

// Get seasonal patterns
export const getSeasonalPatterns = async (req, res) => {
  try {
    // Only admins can view seasonal patterns
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view seasonal patterns data'
      });
    }
    
    const { category, startDate, endDate } = req.query;
    let query = {};
    
    // Date filter
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default to the last year if no date range specified
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      dateRange = {
        timestamp: {
          $gte: oneYearAgo
        }
      };
    }
    
    // Category filter
    if (category && category !== 'all') {
      query['items.equipmentId.category'] = category;
    }
    
    // Get data grouped by month
    const seasonalData = await Payment.aggregate([
      // Match approved payments
      { $match: { status: 'approved', type: 'cart', ...dateRange, ...(Object.keys(query).length > 0 ? query : {}) } },
      // Unwind items
      { $unwind: '$items' },
      // Lookup equipment
      { $lookup: {
          from: 'campingequipments',
          localField: 'items.equipmentId',
          foreignField: '_id',
          as: 'equipment'
        }
      },
      // Unwind equipment
      { $unwind: '$equipment' },
      // Apply category filter if specified
      ...(category && category !== 'all' ? [{ $match: { 'equipment.category': category } }] : []),
      // Group by month and category
      { $group: {
          _id: {
            month: { $month: '$timestamp' },
            year: { $year: '$timestamp' },
            category: '$equipment.category'
          },
          count: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      // Sort by year and month
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Transform the data for the frontend charts
    // Group by month and format data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create a map to store data by month
    const monthlyData = {};
    
    // Initialize with empty months
    for (let i = 0; i < 12; i++) {
      monthlyData[monthNames[i]] = {
        month: monthNames[i],
        tents: 0,
        sleepingBags: 0,
        cookingEquipment: 0,
        lighting: 0,
        hiking: 0,
        other: 0
      };
    }
    
    // Fill in the data from the aggregation results
    seasonalData.forEach(item => {
      const monthIndex = item._id.month - 1; // Convert 1-indexed month to 0-indexed
      const month = monthNames[monthIndex];
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          tents: 0,
          sleepingBags: 0,
          cookingEquipment: 0,
          lighting: 0,
          hiking: 0,
          other: 0
        };
      }
      
      // Map the category to the appropriate field
      const categoryKey = item._id.category.toLowerCase().replace(/\s+/g, '');
      
      if (categoryKey === 'tents') {
        monthlyData[month].tents += item.count;
      } else if (categoryKey === 'sleepingbags' || categoryKey === 'sleeping bags') {
        monthlyData[month].sleepingBags += item.count;
      } else if (categoryKey === 'cooking') {
        monthlyData[month].cookingEquipment += item.count;
      } else if (categoryKey === 'lighting') {
        monthlyData[month].lighting += item.count;
      } else if (categoryKey === 'hiking') {
        monthlyData[month].hiking += item.count;
      } else {
        monthlyData[month].other += item.count;
      }
    });
    
    // Convert map to array for the response
    const formattedData = Object.values(monthlyData);
    
    res.status(200).json({
      success: true,
      seasonalData: formattedData
    });
  } catch (error) {
    console.error('Error fetching seasonal patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seasonal patterns data',
      error: error.message
    });
  }
};

// Get inventory value over time
export const getInventoryValueHistory = async (req, res) => {
  try {
    // Only admins can view inventory value history
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view inventory value history'
      });
    }
    
    // Get inventory audit logs grouped by date
    const auditLogs = await InventoryAuditLog.aggregate([
      // Group by date
      { $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          totalValueAfter: { $sum: '$quantityAfter' }
        }
      },
      // Sort by date
      { $sort: { '_id.date': 1 } },
      // Project to final format
      { $project: {
          _id: 0,
          date: '$_id.date',
          value: '$totalValueAfter'
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      inventoryHistory: auditLogs
    });
  } catch (error) {
    console.error('Error fetching inventory value history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory value history',
      error: error.message
    });
  }
};

export default {
  batchUpdateInventory,
  generateInventoryReport,
  getInventoryStats,
  getTrendingProducts,
  getSeasonalPatterns,
  getInventoryValueHistory
};
