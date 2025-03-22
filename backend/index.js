import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, mongoDBURL, JWT_SECRET } from './config.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import feedbackRoutes from './routes/feedback.js';  // Add feedback routes import

// Get directory name (ES module version of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set JWT_SECRET as an environment variable
process.env.JWT_SECRET = JWT_SECRET;

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Update with your frontend URL
  credentials: true
}));

// Create uploads directory if it doesn't exist
import fs from 'fs';
import { dirname } from 'path';

const uploadsDir = path.join(__dirname, 'uploads/events');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);  // Configure feedback routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Event Management System API');
});

// Connect to MongoDB
mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');
    // Start server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
