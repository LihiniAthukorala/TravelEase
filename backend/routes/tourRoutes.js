import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createTour, getAllTours, getTourById, updateTour, deleteTour } from '../controllers/tourController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, admin, upload.single('image'), createTour);
router.get('/', getAllTours);
router.get('/:id', getTourById);
router.put('/:id', protect, admin, upload.single('image'), updateTour);
router.delete('/:id', protect, admin, deleteTour);

export default router;
