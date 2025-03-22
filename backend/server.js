// Add these imports to the existing imports
import supplierRoutes from './routes/supplierRoutes.js';
import reorderConfigRoutes from './routes/reorderConfigRoutes.js';
import stockOrderRoutes from './routes/stockOrderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import stockMonitorService from './services/stockMonitorService.js';
import cron from 'node-cron';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

// ... existing code ...

// Add these route handlers to the app
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reorder-config', reorderConfigRoutes);
app.use('/api/stock-orders', stockOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/inventory', inventoryRoutes);

// ... existing code ...

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

// ... existing code ...
