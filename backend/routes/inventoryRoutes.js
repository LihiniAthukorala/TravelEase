import express from 'express';
import {
  batchUpdateInventory,
  generateInventoryReport,
  getInventoryStats,
  getTrendingProducts,
  getSeasonalPatterns,
  getInventoryValueHistory
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Batch update inventory
router.post('/batch-update', batchUpdateInventory);

// Generate inventory report
router.get('/report', generateInventoryReport);

// Get inventory statistics
router.get('/stats', getInventoryStats);

// Get trending products (high-demand)
router.get('/trending', getTrendingProducts);

// Get seasonal patterns
router.get('/seasonal', getSeasonalPatterns);

// Get inventory value history
router.get('/value-history', getInventoryValueHistory);

export default router;
