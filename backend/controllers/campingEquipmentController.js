import CampingEquipment from '../models/CampingEquipment.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import InventoryAuditLog from '../models/InventoryAuditLog.js';
import mongoose from 'mongoose';

// Get directory name (ES module version of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all camping equipment
export const getAllEquipment = async (req, res) => {
  try {
    const equipment = await CampingEquipment.find();
    
    res.status(200).json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch camping equipment',
      error: error.message
    });
  }
};

// Get single equipment
export const getEquipment = async (req, res) => {
  try {
    const equipment = await CampingEquipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.status(200).json({
      success: true,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message
    });
  }
};

// Create new equipment
export const createEquipment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('Creating equipment with body:', req.body);
    console.log('File received:', req.file);

    const { name, description, price, quantity, category, isAvailable } = req.body;
    
    // Basic validation
    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description and price for the equipment'
      });
    }
    
    // Handle image upload if available
    let imagePath = '/images/default-equipment.jpg';
    
    if (req.file) {
      // Get relative path for database storage
      const uploadFolder = req.originalUrl.includes('events') ? 'events' : 'equipment';
      imagePath = `/uploads/${uploadFolder}/${req.file.filename}`;
      console.log(`Image saved: ${imagePath}`);
      
      // Check if file exists
      const fullPath = path.join(__dirname, '..', 'uploads', uploadFolder, req.file.filename);
      console.log(`Checking if file exists at: ${fullPath}`);
      
      if (fs.existsSync(fullPath)) {
        console.log('File confirmed at:', fullPath);
      } else {
        console.error('Warning: File not found at expected location:', fullPath);
      }
    } else {
      console.log('No image uploaded, using default');
    }

    const equipment = new CampingEquipment({
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      category,
      image: imagePath,
      isAvailable: isAvailable === 'true' || isAvailable === true,
      status: 'available',
      condition: req.body.condition || 'new',
      serialNumber: req.body.serialNumber,
      barcodeId: req.body.barcodeId,
      location: req.body.location,
      purchaseDate: req.body.purchaseDate,
      purchasePrice: req.body.purchasePrice,
      warrantyExpiryDate: req.body.warrantyExpiryDate,
      notes: req.body.notes
    });

    await equipment.save({ session });
    
    // Create audit log for new equipment
    const auditLog = new InventoryAuditLog({
      equipment: equipment._id,
      actionType: 'stock-in',  // Changed from 'create' to valid enum value 'stock-in'
      quantityBefore: 0,
      quantityAfter: equipment.quantity,
      statusBefore: null,
      statusAfter: 'available',
      reference: null,
      reason: 'Initial inventory addition',
      performedBy: req.user._id,
      notes: 'New equipment created'
    });
    
    await auditLog.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    console.log('Equipment saved:', equipment);
    
    res.status(201).json({
      success: true,
      equipment: equipment
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create equipment',
      error: error.message
    });
  }
};

// Update equipment
export const updateEquipment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('Updating equipment with ID:', req.params.id);
    console.log('Update data:', req.body);
    console.log('File received:', req.file);
    
    let equipment = await CampingEquipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    const oldQuantity = equipment.quantity;
    const oldStatus = equipment.status;

    const updateData = { ...req.body };
    
    // Handle image upload if a new file is provided
    if (req.file) {
      const uploadFolder = req.originalUrl.includes('events') ? 'events' : 'equipment';
      updateData.image = `/uploads/${uploadFolder}/${req.file.filename}`;
      console.log(`New image path: ${updateData.image}`);
    }

    // Add new fields
    if (req.body.status) equipment.status = req.body.status;
    if (req.body.condition) equipment.condition = req.body.condition;
    if (req.body.serialNumber !== undefined) equipment.serialNumber = req.body.serialNumber;
    if (req.body.barcodeId !== undefined) equipment.barcodeId = req.body.barcodeId;
    if (req.body.location !== undefined) equipment.location = req.body.location;
    if (req.body.purchaseDate !== undefined) equipment.purchaseDate = req.body.purchaseDate;
    if (req.body.purchasePrice !== undefined) equipment.purchasePrice = req.body.purchasePrice;
    if (req.body.warrantyExpiryDate !== undefined) equipment.warrantyExpiryDate = req.body.warrantyExpiryDate;
    if (req.body.notes !== undefined) equipment.notes = req.body.notes;
    if (req.body.maintenanceFrequency !== undefined) equipment.maintenanceFrequency = req.body.maintenanceFrequency;

    equipment = await CampingEquipment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    await equipment.save({ session });
    
    // Create audit log for the update
    const auditLog = new InventoryAuditLog({
      equipment: equipment._id,
      actionType: 'update',  // This is already correct
      quantityBefore: oldQuantity,
      quantityAfter: equipment.quantity,
      statusBefore: oldStatus,
      statusAfter: equipment.status,
      reference: null,
      reason: 'Equipment details updated',
      performedBy: req.user._id,
      notes: req.body.updateReason || 'General update'
    });
    
    await auditLog.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    console.log('Equipment updated:', equipment);

    res.status(200).json({
      success: true,
      equipment
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: error.message
    });
  }
};

// Delete equipment
export const deleteEquipment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const equipment = await CampingEquipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    const equipmentId = equipment._id;
    const oldQuantity = equipment.quantity;
    const oldStatus = equipment.status;

    // Create audit log before deletion
    const auditLog = new InventoryAuditLog({
      equipment: equipmentId,
      actionType: 'stock-out',  // Changed from 'delete' to valid enum value 'stock-out'
      quantityBefore: oldQuantity,
      quantityAfter: 0,
      statusBefore: oldStatus,
      statusAfter: 'retired',
      reference: null,
      reason: 'Equipment deleted from system',
      performedBy: req.user._id,
      notes: req.body.deletionReason || 'Equipment removed from inventory'
    });
    
    await auditLog.save({ session });

    // Delete associated image file if it exists and is not the default
    if (equipment.image && !equipment.image.includes('default-equipment') && equipment.image.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '..', equipment.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    await equipment.deleteOne();

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment',
      error: error.message
    });
  }
};
