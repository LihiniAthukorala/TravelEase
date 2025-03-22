import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createEvent,
  getAllEvents,
  getMyEvents,
  getPendingEvents,
  getEvent,
  updateEvent,
  approveEvent,
  deleteEvent,
  registerForEvent,
  getPublicEvent,
  getPublicEvents
} from '../controllers/eventController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getPublicEvents);
router.get('/public/:id', getPublicEvent);

// Protected routes
router.post('/', protect, upload.single('image'), createEvent);
router.get('/', protect, getAllEvents);
router.get('/myevents', protect, getMyEvents);
router.get('/pending', protect, admin, getPendingEvents);
router.put('/:id/approve', protect, admin, approveEvent);
router.post('/:id/register', protect, registerForEvent);

// Routes with dynamic parameters should come last
router.get('/:id', getEvent);
router.put('/:id', protect, upload.single('image'), updateEvent);
router.delete('/:id', protect, deleteEvent);

export default router;
