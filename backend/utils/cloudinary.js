const cloudinary = require('cloudinary').v2;

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const splitUrl = url.split('/');
  const startIndex = splitUrl.indexOf('wall-of-humanity');
  if (startIndex === -1) return null;
  return splitUrl.slice(startIndex).join('/').split('.')[0];
};

const deleteCloudinaryImage = async (imageUrl) => {
  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) return null;
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = { deleteCloudinaryImage, getPublicIdFromUrl }; 