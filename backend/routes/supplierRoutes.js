import express from 'express';
import { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../controllers/supplierController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All supplier routes require authentication
router.use(protect);

// Get all suppliers and create new supplier
router.route('/')
  .get(getSuppliers)
  .post(createSupplier);

// Get, update and delete supplier by ID
router.route('/:id')
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

export default router;
