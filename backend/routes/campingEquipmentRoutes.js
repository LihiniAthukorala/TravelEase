import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment
} from '../controllers/campingEquipmentController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllEquipment);
router.get('/:id', getEquipment);

// Protected routes (admin only)
router.post('/', protect, admin, upload.single('image'), createEquipment);
router.put('/:id', protect, admin, upload.single('image'), updateEquipment);
router.delete('/:id', protect, admin, deleteEquipment);

export default router;
