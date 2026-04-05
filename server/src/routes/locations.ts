import { Router } from 'express';
import Location from '../models/Location';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const extractPublicIdFromUrl = (url: string) => {
  try {
    const splitUpload = url.split('/upload/');
    if (splitUpload.length < 2) return null;
    let path = splitUpload[1];
    if (path.match(/^v\d+\//)) path = path.replace(/^v\d+\//, '');
    return path.substring(0, path.lastIndexOf('.'));
  } catch (e) {
    return null;
  }
};

const router = Router();

// DELETE /locations/:id - safely tear down Cloudinary media AND local database references
router.delete('/:id', async (req, res) => {
  try {
    // 1. Fetch location to survey attached images
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });

    // 2. Transmit destructive commands to Cloudinary natively via SDK
    if (loc.images && loc.images.length > 0) {
       const deletePromises = loc.images.map((url: string) => {
          const publicId = extractPublicIdFromUrl(url);
          if (publicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key') {
             return cloudinary.uploader.destroy(publicId).catch((e: Error) => console.error("Cloudinary wipe error:", e.message));
          }
          return Promise.resolve();
       });
       await Promise.all(deletePromises);
    }

    // 3. Scrub MongoDB
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location and Cloud Media successfully obliterated!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /locations - retrieve map pins within optional bounds
router.get('/', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng, type } = req.query;
    let query: any = {};

    if (type) {
      query.type = type;
    }

    // If client provides bounds, filter via $geoWithin
    if (minLat && maxLat && minLng && maxLng) {
      query.location = {
        $geoWithin: {
          $box: [
            [parseFloat(minLng as string), parseFloat(minLat as string)],
            [parseFloat(maxLng as string), parseFloat(maxLat as string)],
          ],
        },
      };
    }

    const locations = await Location.find(query);
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST /locations - save new map pin
router.post('/', async (req, res) => {
  try {
    const { title, description, type, metadata, coordinates, images, createdBy } = req.body;

    if (!title || !description || !coordinates) {
      return res.status(400).json({ error: 'Title, description, and coordinates are required' });
    }

    const newLocation = new Location({
      title,
      description,
      type: type || 'generic',
      metadata: metadata || {},
      images: Array.isArray(images) ? images : [], // Natively insert image array
      location: {
        type: 'Point',
        coordinates, // Must be [lng, lat]
      },
      createdBy
    });

    const savedLocation = await newLocation.save();
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

export default router;
