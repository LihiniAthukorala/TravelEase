import Supplier from '../models/Supplier.js';

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
