import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { upload } from '../middleware/upload.js';
import {
  createLocation,
  getLocations,
  getLocationById,
  uploadImage,
} from '../controllers/locationController.js';

const router = Router();

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

router.post('/upload-image', writeLimiter, upload.single('image'), uploadImage);

router.post('/', writeLimiter, createLocation);
router.get('/', readLimiter, getLocations);
router.get('/:id', readLimiter, getLocationById);

export default router;
