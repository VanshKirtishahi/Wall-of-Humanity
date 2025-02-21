const express = require('express');
const auth = require('../middleware/auth');
const FreeFoodListing = require('../models/FreeFoodListing');
const { freeFoodUpload } = require('../middleware/upload');
const { deleteCloudinaryImage } = require('../utils/cloudinary');

const router = express.Router();

// Create new listing with image upload
router.post('/', auth, freeFoodUpload.single('venueImage'), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['venue', 'foodType', 'organizedBy'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Required fields missing: ${missingFields.join(', ')}` 
      });
    }

    let availability = {};
    try {
      if (req.body.availability) {
        availability = JSON.parse(req.body.availability);
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid availability format' });
    }

    const listingData = {
      venue: req.body.venue.trim(),
      foodType: req.body.foodType,
      organizedBy: req.body.organizedBy.trim(),
      uploadedBy: req.user._id,
      availability: {
        type: availability.type || 'specific',
        startTime: availability.startTime || '',
        endTime: availability.endTime || '',
        specificDate: availability.specificDate || '',
        notes: availability.notes || ''
      }
    };

    // Parse location if exists
    if (req.body.location) {
      try {
        listingData.location = JSON.parse(req.body.location);
      } catch (error) {
        console.error('Error parsing location:', error);
        return res.status(400).json({ message: 'Invalid location format' });
      }
    }

    // Add image if uploaded
    if (req.file) {
      listingData.venueImage = req.file.path;
    }

    const listing = new FreeFoodListing(listingData);
    await listing.save();
    
    console.log('Created listing:', listing);
    res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating free food listing:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await FreeFoodListing.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(listings);
  } catch (error) {
    console.error('Error fetching free food listings:', error);
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await FreeFoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update listing
router.put('/:id', auth, freeFoodUpload.single('venueImage'), async (req, res) => {
  try {
    const listing = await FreeFoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const listingData = { ...req.body };
    
    // Parse JSON fields
    try {
      if (req.body.availability) {
        listingData.availability = JSON.parse(req.body.availability);
      }
      if (req.body.location) {
        listingData.location = JSON.parse(req.body.location);
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON data' });
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (listing.venueImage) {
        try {
          await deleteCloudinaryImage(listing.venueImage);
        } catch (cloudinaryError) {
          console.error('Error deleting old image:', cloudinaryError);
        }
      }
      listingData.venueImage = req.file.path;
    } else if (req.body.deleteImage === 'true' && listing.venueImage) {
      // Handle image deletion without replacement
      try {
        await deleteCloudinaryImage(listing.venueImage);
        listingData.venueImage = null;
      } catch (cloudinaryError) {
        console.error('Error deleting image:', cloudinaryError);
      }
    }

    const updatedListing = await FreeFoodListing.findByIdAndUpdate(
      req.params.id,
      listingData,
      { new: true, runValidators: true }
    );

    res.json(updatedListing);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete listing
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await FreeFoodListing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    // Delete from database first
    await FreeFoodListing.findByIdAndDelete(req.params.id);

    // Then attempt to delete the image asynchronously
    if (listing.venueImage) {
      deleteCloudinaryImage(listing.venueImage)
        .catch(error => console.error('Cloudinary cleanup error:', error));
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
});

// Get user's listings
router.get('/my-listings', auth, async (req, res) => {
  try {
    const listings = await FreeFoodListing.find({ uploadedBy: req.user._id });
    res.json(listings);
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

module.exports = router; 