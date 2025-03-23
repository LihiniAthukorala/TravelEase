import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import supplierRoutes from './routes/supplierRoutes.js';
import reorderConfigRoutes from './routes/reorderConfigRoutes.js';
import stockOrderRoutes from './routes/stockOrderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import stockMonitorService from './services/stockMonitorService.js';
import cron from 'node-cron';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import tourPaymentRoutes from './routes/tourPaymentRoutes.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// IMPORTANT: Apply middleware first
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// API Routes - make sure these come after middleware
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reorder-config', reorderConfigRoutes);
app.use('/api/stock-orders', stockOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tour-payments', tourPaymentRoutes);

// Set up periodic stock monitoring (every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled inventory check');
  try {
    await stockMonitorService.checkInventoryLevels();
  } catch (error) {
    console.error('Error in scheduled inventory check:', error);
  }
});

// Initial inventory check on startup
setTimeout(async () => {
  try {
    console.log('Performing initial inventory check on startup');
    await stockMonitorService.checkInventoryLevels();
  } catch (error) {
    console.error('Error in initial inventory check:', error);
  }
}, 5000); // Wait 5 seconds after startup before checking

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
