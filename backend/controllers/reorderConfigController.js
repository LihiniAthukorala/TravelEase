import ReorderConfig from '../models/ReorderConfig.js';
import CampingEquipment from '../models/CampingEquipment.js';

// Get reorder config for specific equipment
export const getReorderConfig = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    
    // Only admins can view reorder configurations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view reorder configurations'
      });
    }
    
    // Check if equipment exists
    const equipment = await CampingEquipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Find reorder config for this equipment, populate supplier details
    const config = await ReorderConfig.findOne({ equipment: equipmentId }).populate('preferredSupplier');
    
    // If no config exists yet, return default values
    if (!config) {
      return res.status(200).json({
        success: true,
        config: {
          equipment: equipmentId,
          threshold: 5,
          reorderQuantity: 10,
          autoReorderEnabled: false,
          preferredSupplier: null
        }
      });
    }
    
    res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching reorder config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reorder configuration',
      error: error.message
    });
  }
};

// Get all reorder configs
export const getAllReorderConfigs = async (req, res) => {
  try {
    // Only admins can view all reorder configurations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view reorder configurations'
      });
    }
    
    const configs = await ReorderConfig.find()
      .populate('equipment', 'name category price quantity')
      .populate('preferredSupplier', 'name email');
    
    res.status(200).json({
      success: true,
      count: configs.length,
      configs
    });
  } catch (error) {
    console.error('Error fetching reorder configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reorder configurations',
      error: error.message
    });
  }
};

// Create or update reorder config
export const setReorderConfig = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { threshold, preferredSupplierId, reorderQuantity, autoReorderEnabled } = req.body;
    
    // Only admins can update reorder configurations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update reorder configurations'
      });
    }
    
    // Validate required fields
    if (!threshold || threshold < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid threshold (minimum 1)'
      });
    }
    
    if (!reorderQuantity || reorderQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid reorder quantity (minimum 1)'
      });
    }
    
    // Check if equipment exists
    const equipment = await CampingEquipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Find existing config or create new one
    let config = await ReorderConfig.findOne({ equipment: equipmentId });
    
    if (config) {
      // Update existing config
      config.threshold = threshold;
      config.preferredSupplier = preferredSupplierId || null;
      config.reorderQuantity = reorderQuantity;
      config.autoReorderEnabled = autoReorderEnabled || false;
      config.lastUpdated = new Date();
      config.updatedBy = req.user._id;
    } else {
      // Create new config
      config = new ReorderConfig({
        equipment: equipmentId,
        threshold,
        preferredSupplier: preferredSupplierId || null,
        reorderQuantity,
        autoReorderEnabled: autoReorderEnabled || false,
        updatedBy: req.user._id
      });
    }
    
    await config.save();
    
    res.status(200).json({
      success: true,
      message: 'Reorder configuration saved successfully',
      config
    });
  } catch (error) {
    console.error('Error setting reorder config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save reorder configuration',
      error: error.message
    });
  }
};

// Delete reorder config
export const deleteReorderConfig = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    
    // Only admins can delete reorder configurations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete reorder configurations'
      });
    }
    
    const result = await ReorderConfig.deleteOne({ equipment: equipmentId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reorder configuration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Reorder configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reorder config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reorder configuration',
      error: error.message
    });
  }
};
