const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'logo') {
      cb(null, 'uploads/ngo-logos');
    } else if (file.fieldname === 'certification') {
      cb(null, 'uploads/ngo-certificates');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
    cb(null, true);
  }
});

// Get all NGOs
router.get('/', async (req, res) => {
  try {
    const ngos = await NGO.find()
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      ngos
    });
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    res.status(500).json({
      message: 'Error fetching NGOs',
      error: error.message
    });
  }
});

// Submit NGO registration
router.post('/register', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'certification', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received form data:', req.body); // Add logging

    // Validate required fields
    const requiredFields = ['organizationName', 'organizationEmail', 'phoneNumber', 'ngoType', 'address'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const ngo = new NGO({
      organizationName: req.body.organizationName,
      organizationEmail: req.body.organizationEmail,
      phoneNumber: req.body.phoneNumber,
      contactPersonName: req.body.contactPersonName,
      contactPersonEmail: req.body.contactPersonEmail,
      contactPersonPhone: req.body.contactPersonPhone,
      ngoType: req.body.ngoType,
      incorporationDate: req.body.incorporationDate,
      address: req.body.address,
      ngoWebsite: req.body.ngoWebsite,
      socialMediaLinks: req.body.socialMediaLinks,
      logo: req.files?.logo?.[0]?.filename,
      certification: req.files?.certification?.[0]?.filename,
      status: 'pending'
    });

    await ngo.save();

    res.status(201).json({
      message: 'NGO registration submitted successfully',
      ngo: ngo
    });
  } catch (error) {
    console.error('NGO registration error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'An NGO with this email already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Add NGO profile route
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.ngoId) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    const ngo = await NGO.findById(user.ngoId);
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    res.json({ ngo });
  } catch (error) {
    console.error('Error fetching NGO profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this route for debugging
router.get('/debug-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const ngo = user?.ngoId ? await NGO.findById(user.ngoId) : null;
    
    res.json({
      user: {
        id: user._id,
        role: user.role,
        ngoId: user.ngoId
      },
      ngo: ngo
    });
  } catch (error) {
    res.status(500).json({ message: 'Debug route error', error: error.message });
  }
});

module.exports = router; 