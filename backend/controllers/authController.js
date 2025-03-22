import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register a new user
export const register = async (req, res) => {
  try {
    const { username, email, password, contactNumber, address, role } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      contactNumber,
      address,
      role: role === 'admin' ? 'admin' : 'user'
    });
    
    // If user is admin, add admin-specific fields
    if (role === 'admin') {
      user.adminId = `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
      user.department = req.body.department || 'General';
      user.permissions = req.body.permissions || ['view', 'create', 'update'];
      await user.save();
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        role: user.role,
        ...(user.role === 'admin' && {
          adminId: user.adminId,
          department: user.department,
          permissions: user.permissions
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, email, contactNumber, address, currentPassword, newPassword, department, permissions } = req.body;
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
    }
    
    // Only update password if currentPassword and newPassword are provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await user.matchPassword(currentPassword);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Update password
      user.password = newPassword;
    }
    
    // Update user fields
    user.username = username;
    user.email = email;
    user.contactNumber = contactNumber;
    user.address = address;
    
    // If user is admin, update admin-specific fields
    if (user.role === 'admin' && department) {
      user.department = department;
    }
    
    if (user.role === 'admin' && permissions && Array.isArray(permissions)) {
      user.permissions = permissions;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        role: user.role,
        ...(user.role === 'admin' && {
          adminId: user.adminId,
          department: user.department,
          permissions: user.permissions
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
