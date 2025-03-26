import express from 'express';
import { register, login, getMe, getAllUsers, updateProfile, getUserById, updateUser, deleteUser } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getAllUsers);

// Add the update profile route
router.put('/update-profile', protect, updateProfile);

// Add these new routes for user management
router.get('/users/:id', protect, admin, getUserById);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
