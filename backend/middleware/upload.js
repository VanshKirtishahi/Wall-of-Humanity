const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const createStorage = (folderPath) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `wall-of-humanity/${folderPath}`,
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
};

const donationStorage = createStorage('donations');
const freeFoodStorage = createStorage('free-food');
const ngoLogoStorage = createStorage('ngo-logos');
const ngoCertificateStorage = createStorage('ngo-certificates');

const uploadConfig = {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
};

const donationUpload = multer({
  storage: donationStorage,
  ...uploadConfig
});

const freeFoodUpload = multer({
  storage: freeFoodStorage,
  ...uploadConfig
});

// Add NGO upload configurations
const ngoLogoUpload = multer({
  storage: ngoLogoStorage,
  ...uploadConfig,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Logo must be an image file!'), false);
    }
  }
});

const ngoCertificateUpload = multer({
  storage: ngoCertificateStorage,
  ...uploadConfig,
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