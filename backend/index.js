import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, mongoDBURL, JWT_SECRET } from './config.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import feedbackRoutes from './routes/feedback.js';
import campingEquipmentRoutes from './routes/campingEquipmentRoutes.js';
import cartRoutes from './routes/cartRoutes.js';

// Get directory name (ES module version of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set JWT_SECRET as an environment variable
process.env.JWT_SECRET = JWT_SECRET;

const app = express();

// Middleware
app.use(express.json());
// Configure CORS to allow requests from frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Support both potential frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create uploads directory if it doesn't exist
import fs from 'fs';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const eventsDir = path.join(__dirname, 'uploads/events');
if (!fs.existsSync(eventsDir)) {
  fs.mkdirSync(eventsDir, { recursive: true });
}

const equipmentDir = path.join(__dirname, 'uploads/equipment');
if (!fs.existsSync(equipmentDir)) {
  fs.mkdirSync(equipmentDir, { recursive: true });
}

console.log(`Uploads directory paths:`);
console.log(`- Base: ${uploadsDir}`);
console.log(`- Events: ${eventsDir}`);
console.log(`- Equipment: ${equipmentDir}`);

// Serve static files from uploads directory with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Test route to verify uploads directory accessibility
app.get('/api/test-upload-path', (req, res) => {
  res.json({
    success: true,
    message: 'Upload paths check',
    paths: {
      base: fs.existsSync(uploadsDir) ? 'exists' : 'missing',
      events: fs.existsSync(eventsDir) ? 'exists' : 'missing',
      equipment: fs.existsSync(equipmentDir) ? 'exists' : 'missing',
    }
  });
});

// Add a test endpoint to verify upload paths
app.get('/api/test-uploads', (req, res) => {
  const testPath = path.join(__dirname, 'uploads', 'equipment');
  const files = fs.existsSync(testPath) ? fs.readdirSync(testPath) : [];
  
  res.json({
    success: true,
    message: 'Upload directory test',
    exists: fs.existsSync(testPath),
    files: files,
    path: testPath
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/camping-equipment', campingEquipmentRoutes);
app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Online Tourism and Travel Management System API');
});

// Connect to MongoDB
mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
