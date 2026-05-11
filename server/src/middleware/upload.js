const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Room images storage — stored in roomradar/rooms folder on Cloudinary
const roomStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'roomradar/rooms',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Avatar / profile picture storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'roomradar/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Middleware for uploading up to 5 room images
const uploadRoomImages = multer({
  storage: roomStorage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per file
}).array('images', 5);

// Middleware for uploading a single avatar
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
}).single('avatar');

module.exports = { uploadRoomImages, uploadAvatar };
