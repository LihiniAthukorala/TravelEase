import express from 'express';
import {
  createSupplier,
  updateSupplier,
  getAllSuppliers,
  getSupplierById,
  deleteSupplier
} from '../controllers/supplierController.js';

const router = express.Router();

// Create a new supplier
router.post('/', createSupplier);

// Update a supplier
router.put('/:id', updateSupplier);

// Get all suppliers
router.get('/', getAllSuppliers);

// Get a single supplier by ID
router.get('/:id', getSupplierById);

// Delete a supplier
router.delete('/:id', deleteSupplier);

export default router; 