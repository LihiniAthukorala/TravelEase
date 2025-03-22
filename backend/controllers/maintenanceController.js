import MaintenanceRecord from '../models/MaintenanceRecord.js';
import DamageReport from '../models/DamageReport.js';
import CampingEquipment from '../models/CampingEquipment.js';
import InventoryAuditLog from '../models/InventoryAuditLog.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/emailService.js';

// Get all maintenance records
export const getAllMaintenanceRecords = async (req, res) => {
  try {
    // Only admins can view all maintenance records
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view maintenance records'
      });
    }

    const { status, priority, maintenanceType } = req.query;
    let query = {};
    
    // Apply filters if provided
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (maintenanceType) query.maintenanceType = maintenanceType;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    const records = await MaintenanceRecord.find(query)
      .populate('equipment', 'name category image status')
      .populate('vendor', 'name email phone')
      .populate('createdBy', 'username email')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await MaintenanceRecord.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: records.length,
      total,
      pages: Math.ceil(total / limit),
      records
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance records',
      error: error.message
    });
  }
};

// Get maintenance record by ID
export const getMaintenanceRecordById = async (req, res) => {
  try {
    // Only admins can view maintenance details
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view maintenance details'
      });
    }
    
    const record = await MaintenanceRecord.findById(req.params.id)
      .populate('equipment', 'name category image status condition')
      .populate('vendor', 'name email phone address')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance record',
      error: error.message
    });
  }
};

// Create maintenance record
export const createMaintenanceRecord = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Only admins can create maintenance records
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create maintenance records'
      });
    }
    
    const {
      equipmentId,
      maintenanceType,
      priority,
      description,
      scheduledDate,
      estimatedCost,
      performedBy,
      vendorId,
      notes
    } = req.body;
    
    // Validate required fields
    if (!equipmentId || !maintenanceType || !description || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: equipment, maintenanceType, description, scheduledDate'
      });
    }
    
    // Check if equipment exists
    const equipment = await CampingEquipment.findById(equipmentId).session(session);
    if (!equipment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Create maintenance record
    const maintenanceRecord = new MaintenanceRecord({
      equipment: equipmentId,
      maintenanceType,
      priority: priority || 'medium',
      description,
      scheduledDate,
      estimatedCost,
      performedBy,
      vendor: vendorId,
      notes,
      createdBy: req.user._id
    });
    
    await maintenanceRecord.save({ session });
    
    // Update equipment status if maintenance is now
    const scheduledTime = new Date(scheduledDate).getTime();
    const now = new Date().getTime();
    const isImmediate = Math.abs(scheduledTime - now) < 24 * 60 * 60 * 1000; // Within 24 hours
    
    if (isImmediate) {
      const oldStatus = equipment.status;
      equipment.status = 'maintenance';
      equipment.nextMaintenanceScheduled = scheduledDate;
      await equipment.save({ session });
      
      // Create audit log for this change
      const auditLog = new InventoryAuditLog({
        equipment: equipmentId,
        actionType: 'maintenance',
        quantityBefore: equipment.quantity,
        quantityAfter: equipment.quantity,
        statusBefore: oldStatus,
        statusAfter: 'maintenance',
        reference: maintenanceRecord._id.toString(),
        reason: `Scheduled for ${maintenanceType} maintenance`,
        performedBy: req.user._id,
        notes: description
      });
      
      await auditLog.save({ session });
    } else {
      equipment.nextMaintenanceScheduled = scheduledDate;
      await equipment.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      record: maintenanceRecord
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance record',
      error: error.message
    });
  }
};

// Update maintenance record
export const updateMaintenanceRecord = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Only admins can update maintenance records
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update maintenance records'
      });
    }
    
    const {
      maintenanceType,
      status,
      priority,
      description,
      scheduledDate,
      startDate,
      completionDate,
      estimatedCost,
      actualCost,
      performedBy,
      vendorId,
      notes
    } = req.body;
    
    const record = await MaintenanceRecord.findById(req.params.id).session(session);
    
    if (!record) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    // Get the associated equipment
    const equipment = await CampingEquipment.findById(record.equipment).session(session);
    
    if (!equipment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Associated equipment not found'
      });
    }
    
    const previousStatus = record.status;
    
    // Update fields if provided
    if (maintenanceType) record.maintenanceType = maintenanceType;
    if (status) record.status = status;
    if (priority) record.priority = priority;
    if (description) record.description = description;
    if (scheduledDate) record.scheduledDate = scheduledDate;
    if (startDate) record.startDate = startDate;
    if (completionDate) record.completionDate = completionDate;
    if (estimatedCost !== undefined) record.estimatedCost = estimatedCost;
    if (actualCost !== undefined) record.actualCost = actualCost;
    if (performedBy) record.performedBy = performedBy;
    if (vendorId) record.vendor = vendorId;
    if (notes !== undefined) record.notes = notes;
    
    record.updatedBy = req.user._id;
    record.updatedAt = Date.now();
    
    await record.save({ session });
    
    // Handle equipment status changes based on maintenance status
    if (status && status !== previousStatus) {
      if (status === 'in-progress' && equipment.status !== 'maintenance') {
        const oldStatus = equipment.status;
        equipment.status = 'maintenance';
        
        // Create audit log entry
        const auditLog = new InventoryAuditLog({
          equipment: equipment._id,
          actionType: 'maintenance',
          quantityBefore: equipment.quantity,
          quantityAfter: equipment.quantity,
          statusBefore: oldStatus,
          statusAfter: 'maintenance',
          reference: record._id.toString(),
          reason: 'Maintenance started',
          performedBy: req.user._id,
          notes: `Maintenance status changed from ${previousStatus} to ${status}`
        });
        
        await auditLog.save({ session });
      }
      else if (status === 'completed' && equipment.status === 'maintenance') {
        equipment.status = 'available';
        equipment.lastMaintenance = completionDate || new Date();
        
        // Calculate next maintenance date based on frequency
        if (equipment.maintenanceFrequency) {
          const nextDate = new Date(equipment.lastMaintenance);
          nextDate.setDate(nextDate.getDate() + equipment.maintenanceFrequency);
          equipment.nextMaintenanceScheduled = nextDate;
        }
        
        // Create audit log entry
        const auditLog = new InventoryAuditLog({
          equipment: equipment._id,
          actionType: 'maintenance',
          quantityBefore: equipment.quantity,
          quantityAfter: equipment.quantity,
          statusBefore: 'maintenance',
          statusAfter: 'available',
          reference: record._id.toString(),
          reason: 'Maintenance completed',
          performedBy: req.user._id,
          notes: `Maintenance completed on ${equipment.lastMaintenance}`
        });
        
        await auditLog.save({ session });
      }
      
      await equipment.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: 'Maintenance record updated successfully',
      record
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance record',
      error: error.message
    });
  }
};

// Delete maintenance record
export const deleteMaintenanceRecord = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Only admins can delete maintenance records
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete maintenance records'
      });
    }
    
    const record = await MaintenanceRecord.findById(req.params.id).session(session);
    
    if (!record) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    // Can only delete records that are scheduled or cancelled
    if (!['scheduled', 'cancelled'].includes(record.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot delete maintenance record with status '${record.status}'`
      });
    }
    
    // Remove scheduled maintenance reference from equipment if it exists
    const equipment = await CampingEquipment.findById(record.equipment).session(session);
    if (equipment && equipment.nextMaintenanceScheduled) {
      const scheduledDate = new Date(record.scheduledDate).toDateString();
      const nextMaintDate = new Date(equipment.nextMaintenanceScheduled).toDateString();
      
      if (scheduledDate === nextMaintDate) {
        equipment.nextMaintenanceScheduled = null;
        await equipment.save({ session });
      }
    }
    
    await MaintenanceRecord.findByIdAndDelete(req.params.id, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance record',
      error: error.message
    });
  }
};

// Get all damage reports
export const getAllDamageReports = async (req, res) => {
  try {
    // Only admins can view all damage reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view damage reports'
      });
    }

    const { status, severity, damageType } = req.query;
    let query = {};
    
    // Apply filters if provided
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (damageType) query.damageType = damageType;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    const reports = await DamageReport.find(query)
      .populate('equipment', 'name category image status')
      .populate('reportedBy', 'username email')
      .populate('maintenanceRecord', 'status scheduledDate')
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await DamageReport.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / limit),
      reports
    });
  } catch (error) {
    console.error('Error fetching damage reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch damage reports',
      error: error.message
    });
  }
};

// Create damage report
export const createDamageReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      equipmentId,
      damageType,
      severity,
      description,
      location,
      images
    } = req.body;
    
    // Validate required fields
    if (!equipmentId || !damageType || !severity || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: equipment, damageType, severity, description'
      });
    }
    
    // Check if equipment exists
    const equipment = await CampingEquipment.findById(equipmentId).session(session);
    if (!equipment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Create damage report
    const damageReport = new DamageReport({
      equipment: equipmentId,
      damageType,
      severity,
      description,
      location,
      images: images || [],
      reportedBy: req.user._id
    });
    
    await damageReport.save({ session });
    
    // Update equipment status if damage is severe enough
    if (['major', 'critical'].includes(severity) && equipment.status !== 'damaged') {
      const oldStatus = equipment.status;
      equipment.status = 'damaged';
      equipment.condition = severity === 'critical' ? 'poor' : 'fair';
      await equipment.save({ session });
      
      // Create audit log for this change
      const auditLog = new InventoryAuditLog({
        equipment: equipmentId,
        actionType: 'damage',
        quantityBefore: equipment.quantity,
        quantityAfter: equipment.quantity,
        statusBefore: oldStatus,
        statusAfter: 'damaged',
        reference: damageReport._id.toString(),
        reason: `${severity} damage reported: ${damageType}`,
        performedBy: req.user._id,
        notes: description
      });
      
      await auditLog.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Send notification to admin team
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        sendEmail(
          admin.email,
          `Damage Report: ${equipment.name} - ${severity.toUpperCase()}`,
          `A ${severity} damage has been reported for ${equipment.name}.\n\nDamage Type: ${damageType}\nReported By: ${req.user.username}\nDescription: ${description}\n\nPlease log in to the admin dashboard to take action.`
        );
      }
    } catch (emailError) {
      console.error('Failed to send damage notification email:', emailError);
      // Don't fail the whole request if just the email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Damage report created successfully',
      report: damageReport
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating damage report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create damage report',
      error: error.message
    });
  }
};

// Update damage report status
export const updateDamageReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Only admins can update damage reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update damage reports'
      });
    }
    
    const {
      status,
      maintenanceRecordId,
      estimatedRepairCost,
      actualRepairCost,
      resolutionNotes
    } = req.body;
    
    const report = await DamageReport.findById(req.params.id).session(session);
    
    if (!report) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Damage report not found'
      });
    }
    
    // Update fields if provided
    if (status) report.status = status;
    if (maintenanceRecordId) report.maintenanceRecord = maintenanceRecordId;
    if (estimatedRepairCost !== undefined) report.estimatedRepairCost = estimatedRepairCost;
    if (actualRepairCost !== undefined) report.actualRepairCost = actualRepairCost;
    if (resolutionNotes !== undefined) report.resolutionNotes = resolutionNotes;
    
    await report.save({ session });
    
    // Update equipment status based on damage resolution
    if (status) {
      const equipment = await CampingEquipment.findById(report.equipment).session(session);
      
      if (!equipment) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Associated equipment not found'
        });
      }
      
      if (status === 'repaired' && equipment.status === 'damaged') {
        equipment.status = 'available';
        
        // Improve condition after repair
        if (equipment.condition === 'poor') {
          equipment.condition = 'fair';
        } else if (equipment.condition === 'fair') {
          equipment.condition = 'good';
        }
        
        await equipment.save({ session });
        
        // Create audit log entry
        const auditLog = new InventoryAuditLog({
          equipment: equipment._id,
          actionType: 'update',
          quantityBefore: equipment.quantity,
          quantityAfter: equipment.quantity,
          statusBefore: 'damaged',
          statusAfter: 'available',
          reference: report._id.toString(),
          reason: 'Item repaired',
          performedBy: req.user._id,
          notes: resolutionNotes || 'Damage repaired'
        });
        
        await auditLog.save({ session });
      }
      else if (status === 'replaced' && equipment.status === 'damaged') {
        equipment.status = 'retired';
        await equipment.save({ session });
        
        // Create audit log entry
        const auditLog = new InventoryAuditLog({
          equipment: equipment._id,
          actionType: 'update',
          quantityBefore: equipment.quantity,
          quantityAfter: equipment.quantity,
          statusBefore: 'damaged',
          statusAfter: 'retired',
          reference: report._id.toString(),
          reason: 'Item replaced',
          performedBy: req.user._id,
          notes: resolutionNotes || 'Item replaced due to damage'
        });
        
        await auditLog.save({ session });
      }
      else if (status === 'written-off' && equipment.status === 'damaged') {
        equipment.status = 'retired';
        await equipment.save({ session });
        
        // Create audit log entry
        const auditLog = new InventoryAuditLog({
          equipment: equipment._id,
          actionType: 'update',
          quantityBefore: equipment.quantity,
          quantityAfter: 0,
          statusBefore: 'damaged',
          statusAfter: 'retired',
          reference: report._id.toString(),
          reason: 'Item written off',
          performedBy: req.user._id,
          notes: resolutionNotes || 'Item written off due to irreparable damage'
        });
        
        await auditLog.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: 'Damage report updated successfully',
      report
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating damage report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update damage report',
      error: error.message
    });
  }
};

// Get inventory audit logs
export const getInventoryAuditLogs = async (req, res) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view inventory audit logs'
      });
    }
    
    const { equipmentId, actionType, startDate, endDate } = req.query;
    let query = {};
    
    // Filter by equipment if provided
    if (equipmentId) {
      query.equipment = equipmentId;
    }
    
    // Filter by action type if provided
    if (actionType) {
      query.actionType = actionType;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    const logs = await InventoryAuditLog.find(query)
      .populate('equipment', 'name category')
      .populate('performedBy', 'username email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await InventoryAuditLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      logs
    });
  } catch (error) {
    console.error('Error fetching inventory audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory audit logs',
      error: error.message
    });
  }
};

export default {
  getAllMaintenanceRecords,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getAllDamageReports,
  createDamageReport,
  updateDamageReport,
  getInventoryAuditLogs
};
