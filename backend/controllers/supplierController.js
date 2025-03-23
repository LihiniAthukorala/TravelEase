import { sendLowStockAlertEmail } from '../utils/emailService.js';
import Supplier from '../models/Supplier.js';
import CampingEquipment from '../models/CampingEquipment.js';
import ReorderConfig from '../models/ReorderConfig.js';

// Get all suppliers
export const getSuppliers = async (req, res) => {
  try {
    // Only admins can view suppliers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view suppliers'
      });
    }

    const suppliers = await Supplier.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    // Only admins can view suppliers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view supplier details'
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message
    });
  }
};

// Create new supplier
export const createSupplier = async (req, res) => {
  try {
    // Only admins can add suppliers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add suppliers'
      });
    }

    const { name, email, phone, address, contactPerson, notes } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }
    
    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }
    
    const supplier = new Supplier({
      name,
      email,
      phone,
      address,
      contactPerson,
      notes,
      createdBy: req.user._id
    });
    
    await supplier.save();
    
    res.status(201).json({
      success: true,
      message: 'Supplier added successfully',
      supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add supplier',
      error: error.message
    });
  }
};

// Update supplier
export const updateSupplier = async (req, res) => {
  try {
    // Only admins can update suppliers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update suppliers'
      });
    }

    const { name, email, phone, address, contactPerson, active, notes } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Update fields
    if (name) supplier.name = name;
    if (email) supplier.email = email;
    if (phone !== undefined) supplier.phone = phone;
    if (address !== undefined) supplier.address = address;
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (active !== undefined) supplier.active = active;
    if (notes !== undefined) supplier.notes = notes;
    
    supplier.updatedAt = Date.now();
    
    const updatedSupplier = await supplier.save();
    
    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
};

// Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    // Only admins can delete suppliers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete suppliers'
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    await Supplier.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
};

// Send low stock alerts to suppliers
export const sendLowStockAlerts = async (req, res) => {
  try {
    // Only admins can send stock alerts
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send stock alerts'
      });
    }

    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a list of low stock items'
      });
    }

    // Get all suppliers
    const suppliers = await Supplier.find({ active: true });
    const supplierMap = {};
    suppliers.forEach(supplier => {
      supplierMap[supplier._id.toString()] = supplier;
    });

    // Get reorder configuration to find preferred suppliers
    const reorderConfigs = await ReorderConfig.find();
    const configMap = {};
    reorderConfigs.forEach(config => {
      configMap[config.equipment.toString()] = config;
    });

    // Group items by supplier
    const supplierItems = {};
    
    // Process each item
    for (const item of items) {
      const equipment = await CampingEquipment.findById(item.id);
      if (!equipment) continue;
      
      // Find reorder config to get preferred supplier
      const config = configMap[item.id];
      let supplierId = config?.preferredSupplier?.toString();
      
      // If no preferred supplier in config or supplier doesn't exist, skip
      if (!supplierId || !supplierMap[supplierId]) {
        continue;
      }
      
      // Add item to supplier's list
      if (!supplierItems[supplierId]) {
        supplierItems[supplierId] = [];
      }
      
      supplierItems[supplierId].push({
        id: item.id,
        name: equipment.name,
        quantity: item.quantity,
        status: item.status,
        threshold: config.threshold || 5,
        reorderQuantity: config.reorderQuantity || 10
      });
    }
    
    // Send emails to suppliers
    let sentCount = 0;
    const results = [];
    
    for (const [supplierId, items] of Object.entries(supplierItems)) {
      const supplier = supplierMap[supplierId];
      
      if (supplier && supplier.email) {
        try {
          await sendLowStockAlertEmail(
            supplier.email,
            supplier.name,
            items
          );
          
          sentCount++;
          results.push({
            supplier: supplier.name,
            email: supplier.email,
            itemCount: items.length,
            success: true
          });
        } catch (emailError) {
          console.error(`Failed to send email to supplier ${supplier.name}:`, emailError);
          results.push({
            supplier: supplier.name,
            email: supplier.email,
            itemCount: items.length,
            success: false,
            error: emailError.message
          });
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully sent ${sentCount} email alerts to suppliers`,
      sentCount,
      totalSuppliers: Object.keys(supplierItems).length,
      results
    });
  } catch (error) {
    console.error('Error sending stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send stock alerts',
      error: error.message
    });
  }
};

// Get products by supplier ID
export const getSupplierProducts = async (req, res) => {
  try {
    // Only admins can view supplier products
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view supplier products'
      });
    }

    const supplierId = req.params.id;
    
    // Find all reorder configurations that reference this supplier
    const reorderConfigs = await ReorderConfig.find({ 
      preferredSupplier: supplierId 
    }).populate('equipment');
    
    if (!reorderConfigs || reorderConfigs.length === 0) {
      return res.status(200).json({
        success: true,
        products: [],
        message: 'No products found for this supplier'
      });
    }
    
    // Extract and format the products data
    const products = reorderConfigs.map(config => ({
      _id: config.equipment._id,
      name: config.equipment.name,
      category: config.equipment.category,
      quantity: config.equipment.quantity,
      price: config.equipment.price,
      status: config.equipment.status,
      reorderThreshold: config.threshold,
      reorderQuantity: config.reorderQuantity,
      autoReorder: config.autoReorder
    }));
    
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier products',
      error: error.message
    });
  }
};
