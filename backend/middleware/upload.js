const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for donations
const donationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'donations',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `donation-${uniqueSuffix}`;
    }
  }
});

const donationUpload = multer({ storage: donationStorage });

const freeFoodStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'free-food',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    transformation: [{ width: 1000, crop: 'limit' }],
    format: 'jpg',
    resource_type: 'auto',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${uniqueSuffix}`;
    }
  }
});

const freeFoodUpload = multer({
  storage: freeFoodStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Add NGO upload configurations
const ngoLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ngo-logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, crop: 'limit' }],
    format: 'jpg',
    resource_type: 'auto',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${uniqueSuffix}`;
    }
  }
});

const ngoLogoUpload = multer({
  storage: ngoLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Logo must be an image file!'), false);
    }
  }
});

const ngoCertificateStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ngo-certificates',
    allowed_formats: ['image/jpeg', 'image/png', 'application/pdf'],
    transformation: [{ width: 1000, crop: 'limit' }],
    format: 'jpg',
    resource_type: 'auto',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${uniqueSuffix}`;
    }
  }
});

const ngoCertificateUpload = multer({
  storage: ngoCertificateStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Certificate must be a PDF, JPEG, or PNG file!'), false);
    }
  }
});

module.exports = {
  donationUpload,
  freeFoodUpload,
  ngoLogoUpload,
  ngoCertificateUpload
}; 