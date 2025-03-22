import express from 'express';
import {
  getAllMaintenanceRecords,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getAllDamageReports,
  createDamageReport,
  updateDamageReport,
  getInventoryAuditLogs
} from '../controllers/maintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Maintenance records routes
router.route('/records')
  .get(getAllMaintenanceRecords)
  .post(createMaintenanceRecord);

router.route('/records/:id')
  .get(getMaintenanceRecordById)
  .put(updateMaintenanceRecord)
  .delete(deleteMaintenanceRecord);

// Damage reports routes
router.route('/damage-reports')
  .get(getAllDamageReports)
  .post(createDamageReport);

router.route('/damage-reports/:id')
  .put(updateDamageReport);

// Audit logs routes
router.get('/audit-logs', getInventoryAuditLogs);

export default router;
