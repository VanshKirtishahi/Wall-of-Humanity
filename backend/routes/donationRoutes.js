const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { donationUpload } = require('../middleware/upload');
const Donation = require('../models/Donation');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const Request = require('../models/Request');
const { deleteCloudinaryImage } = require('../utils/cloudinary');

// Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations' });
  }
});

// Get donation stats
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching stats...');
    
    const counts = {
      donations: await Donation.countDocuments(),
      ngos: await NGO.countDocuments(),
      volunteers: await Volunteer.countDocuments(),
      users: await User.countDocuments(),
      requests: await Request.countDocuments()
    };
    
    console.log('Database counts:', counts);
    
    res.json({
      totalDonations: counts.donations,
      ngoCount: counts.ngos,
      volunteerCount: counts.volunteers,
      userCount: counts.users,
      requestCount: counts.requests
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Donation routes are working' });
});

// Get user's donations
router.get('/my-donations', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const donations = await Donation.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    
    res.json(donations);
  } catch (error) {
    console.error('Get my donations error:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId
    });
    res.status(500).json({ 
      message: 'Error fetching donations',
      error: error.message 
    });
  }
});

// Create donation
router.post('/', auth, donationUpload.array('images', 5), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.quantity) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }


    let availability = {};
    let location = {};

    try {
      if (req.body.availability) {
        availability = JSON.parse(req.body.availability);
      }
      if (req.body.location) {
        location = JSON.parse(req.body.location);
      }
    } catch (e) {
      console.error('JSON parsing error:', e);
      return res.status(400).json({ message: 'Invalid JSON format in request' });
    }

    // Create donation data
    const donationData = {
      type: req.body.type || 'Food',
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      quantity: req.body.quantity.trim(),
      foodType: req.body.foodType,
      availability,
      location,
      user: req.userId,
      userId: req.userId,
      donorName: req.user.name,
      images: req.files ? req.files.map(file => file.path) : []
    };

    const donation = new Donation(donationData);
    const savedDonation = await donation.save();
    
    console.log('Created donation:', savedDonation);
    res.status(201).json(savedDonation);
  } catch (error) {
    console.error('Error creating donation:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Internal server error', 
      details: error.message 
    });
  }
});

// Get donation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('user', 'name email');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update donation
router.put('/:id', auth, donationUpload.array('images', 5), async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const donationId = req.params.id;
    const donation = await Donation.findById(donationId).session(session);

    if (!donation) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.userId.toString() !== req.userId) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }

    let updateData = {};
    try {
      updateData = {
        ...req.body,
        location: typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location,
        availability: typeof req.body.availability === 'string' ? JSON.parse(req.body.availability) : req.body.availability
      };
    } catch (error) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid data format' });
    }

    if (req.files && req.files.length > 0) {
      try {
        if (donation.images && donation.images.length > 0) {
          await Promise.all(donation.images.map(imageUrl => deleteCloudinaryImage(imageUrl)));
        }
        updateData.images = req.files.map(file => file.path);
      } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: 'Error processing images' });
      }
    }

    const updatedDonation = await Donation.findOneAndUpdate(
      { _id: donationId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        session 
      }
    );

    await session.commitTransaction();
    res.json(updatedDonation);
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Update error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating donation' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
});

// Delete donation
router.delete('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete images from Cloudinary
    if (donation.images && donation.images.length > 0) {
      await Promise.all(donation.images.map(imageUrl => deleteCloudinaryImage(imageUrl)));
    }

    await donation.deleteOne();
    res.json({ message: 'Donation removed' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Public route to get all available donations
router.get('/public', async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'available' })
      .select('-userId') // Exclude sensitive information
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    console.error('Error fetching public donations:', error);
    res.status(500).json({ message: 'Error fetching donations' });
  }
});

// Add this new debug route
router.get('/debug-stats', async (req, res) => {
  try {
    const users = await User.find();
    const donations = await Donation.find();
    
    const stats = {
      totalUsers: users.length,
      usersByRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      totalDonations: donations.length,
      donations: {
        available: donations.filter(d => d.status === 'available').length,
        pending: donations.filter(d => d.status === 'pending').length,
        completed: donations.filter(d => d.status === 'completed').length
      }
    };

    res.json({
      message: 'Debug Statistics',
      stats,
      rawData: {
        users: users.map(u => ({ id: u._id, role: u.role, email: u.email })),
        donations: donations.map(d => ({ id: d._id, status: d.status }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
