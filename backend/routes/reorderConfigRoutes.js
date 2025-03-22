import express from 'express';
import { 
  getReorderConfig, 
  getAllReorderConfigs, 
  setReorderConfig, 
  deleteReorderConfig 
} from '../controllers/reorderConfigController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all reorder configurations
router.get('/', getAllReorderConfigs);

// Get, set, or delete reorder config for specific equipment
router.route('/:equipmentId')
  .get(getReorderConfig)
  .post(setReorderConfig)
  .put(setReorderConfig)
  .delete(deleteReorderConfig);

export default router;
