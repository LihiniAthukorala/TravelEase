import express from 'express';
import { getUserNotifications, markNotificationAsRead } from '../utils/notificationService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get logged-in user's notifications
router.get('/', (req, res) => {
  try {
    const notifications = getUserNotifications(req.user._id);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', (req, res) => {
  try {
    const success = markNotificationAsRead(req.params.id, req.user._id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

export default router;
