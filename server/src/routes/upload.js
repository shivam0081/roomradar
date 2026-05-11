const express = require('express');
const auth = require('../middleware/auth');
const { uploadRoomImages, uploadAvatar } = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

/**
 * POST /api/upload/room-images
 * Upload up to 5 room images. Returns array of Cloudinary secure_urls.
 * Requires auth.
 */
router.post('/room-images', auth, (req, res) => {
  uploadRoomImages(req, res, (err) => {
    if (err) {
      console.error('Room image upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }
    const urls = req.files.map((f) => f.path); // Cloudinary path = secure_url
    res.json({ urls });
  });
});

/**
 * POST /api/upload/avatar
 * Upload a single profile avatar. Returns the Cloudinary secure_url.
 * Requires auth.
 */
router.post('/avatar', auth, (req, res) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      console.error('Avatar upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    res.json({ url: req.file.path });
  });
});

/**
 * DELETE /api/upload/image
 * Delete an image from Cloudinary by its public_id.
 * Body: { publicId: "roomradar/rooms/abc123" }
 */
router.delete('/image', auth, async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) return res.status(400).json({ message: 'publicId required' });
  try {
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

module.exports = router;
