import CampingEquipment from '../models/CampingEquipment.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
      isAvailable: isAvailable === 'true' || isAvailable === true
    });

    const savedEquipment = await equipment.save();
    console.log('Equipment saved:', savedEquipment);
    
    res.status(201).json({
      success: true,
      equipment: savedEquipment
    });
  } catch (error) {
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

    const updateData = { ...req.body };
    
    // Handle image upload if a new file is provided
    if (req.file) {
      const uploadFolder = req.originalUrl.includes('events') ? 'events' : 'equipment';
      updateData.image = `/uploads/${uploadFolder}/${req.file.filename}`;
      console.log(`New image path: ${updateData.image}`);
    }

    equipment = await CampingEquipment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    console.log('Equipment updated:', equipment);

    res.status(200).json({
      success: true,
      equipment
    });
  } catch (error) {
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
  try {
    const equipment = await CampingEquipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Delete associated image file if it exists and is not the default
    if (equipment.image && !equipment.image.includes('default-equipment') && equipment.image.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '..', equipment.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    await equipment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment',
      error: error.message
    });
  }
};
