const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { deleteCloudinaryImage } = require('../utils/cloudinary');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for NGO files
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wall-of-humanity/ngo-logos',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image'
  }
});

const certificationStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wall-of-humanity/ngo-certificates',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image'
  }
});

const logoUpload = multer({ storage: logoStorage });
const certificationUpload = multer({ storage: certificationStorage });

// Use both upload middlewares
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "logo" || file.fieldname === "certification") {
      cb(null, true);
    } else {
      cb(new Error("Unexpected field"));
    }
  }
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'certification', maxCount: 1 }
]);

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

// Create NGO with Cloudinary upload
router.post('/', auth, upload, async (req, res) => {
  try {
    const ngoData = {
      ...req.body,
      userId: req.user._id
    };

    if (req.files) {
      if (req.files.logo) {
        ngoData.logo = req.files.logo[0].path;
      }
      if (req.files.certification) {
        ngoData.certification = req.files.certification[0].path;
      }
    }

    const ngo = new NGO(ngoData);
    await ngo.save();

    res.status(201).json(ngo);
  } catch (error) {
    console.error('Error creating NGO:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.organizationEmail) {
      return res.status(400).json({ 
        message: 'An NGO with this email address already exists. Please use a different email.' 
      });
    }

    // Handle other errors
    res.status(500).json({ 
      message: error.message || 'An error occurred while creating the NGO' 
    });
  }
});

// Update NGO
router.put('/:id', auth,
  async (req, res) => {
    try {
      const ngo = await NGO.findById(req.params.id);
      if (!ngo) {
        return res.status(404).json({ message: 'NGO not found' });
      }

      if (ngo.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const updateData = { ...req.body };

      const updatedNGO = await NGO.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(updatedNGO);
    } catch (error) {
      console.error('Error updating NGO:', error);
      res.status(500).json({ message: error.message });
    }
});

// Delete NGO
router.delete('/:id', auth, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    if (ngo.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete images from Cloudinary
    if (ngo.logo) {
      await deleteCloudinaryImage(ngo.logo);
    }
    if (ngo.certification) {
      await deleteCloudinaryImage(ngo.certification);
    }

    await ngo.deleteOne();
    res.json({ message: 'NGO removed' });
  } catch (error) {
    console.error('Error deleting NGO:', error);
    res.status(500).json({ message: error.message });
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