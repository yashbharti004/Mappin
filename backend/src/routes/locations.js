import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import {
  createLocation,
  getLocations,
  getLocationById,
  uploadImage,
} from '../controllers/locationController.js';

const router = Router();

router.post('/upload-image', upload.single('image'), uploadImage);

router.post('/', createLocation);
router.get('/', getLocations);
router.get('/:id', getLocationById);

export default router;
