const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const Donation = require('../models/Donation');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const emailService = require('../services/email.service');
const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { avatarUpload } = require('../config/cloudinary');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMulter = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'avatars',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      transformation: [{ width: 500, height: 500, crop: 'fill' }]
    }
  })
});

// Test route to verify auth routes are working
router.get('/', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

// Register route with validation
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't return error here, just log it
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user',
      details: error.message 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ 
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password'); // Explicitly include password field

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('User found but password is undefined:', user._id);
      return res.status(500).json({ 
        message: 'Please reset your password or contact support'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send complete response
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get profile route
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get basic user data
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('_id name email createdAt updatedAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in user route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token route
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // Longer expiration
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ message: 'Token verification failed' });
  }
});

// Update profile route
router.put('/profile', auth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle avatar upload
    if (req.file) {
      try {
        // Delete old avatar if exists
        if (user.avatarUrl && user.avatarUrl.includes('cloudinary')) {
          const publicId = user.avatarUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`wall-of-humanity/avatars/${publicId}`);
        }
        req.body.avatarUrl = req.file.path;
      } catch (deleteError) {
        console.error('Error handling avatar:', deleteError);
      }
    }

    // Update user data
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      bio: req.body.bio,
      phone: req.body.phone,
      address: req.body.address
    };

    if (req.body.avatarUrl) {
      updateData.avatarUrl = req.body.avatarUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete profile route
router.delete('/profile/delete', auth, async (req, res) => {
  try {
    // Find and delete the user
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete any associated data (like donations, etc.)
    await Promise.all([
      // Add other model deletions here if needed
      Donation.deleteMany({ userId: req.userId }),
      // Example: Comment.deleteMany({ userId: req.userId })
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Log registered routes
console.log('\nAuth Routes:');
router.stack.forEach(r => {
  if (r.route) {
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});

module.exports = router;