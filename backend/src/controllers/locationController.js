import Location from '../models/Location.js';
import { uploadToCloudinary } from '../middleware/upload.js';

export async function createLocation(req, res, next) {
  try {
    const { title, description, type, metadata, coordinates, imageUrl, createdBy } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: 'coordinates must be an array of [longitude, latitude]' });
    }

    const images = imageUrl ? [imageUrl] : [];

    const location = new Location({
      title,
      description,
      type: type || 'generic',
      images,
      location: {
        type: 'Point',
        coordinates: coordinates.map(Number),
      },
      metadata: metadata || {},
      createdBy: createdBy || null,
    });

    const saved = await location.save();
    return res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

export async function getLocations(req, res, next) {
  try {
    const { bounds, type } = req.query;
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (bounds) {
      const parsed = JSON.parse(bounds);
      const { west, south, east, north } = parsed;
      filter.location = {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ]],
          },
        },
      };
    }

    const locations = await Location.find(filter).limit(200);
    return res.status(200).json(locations);
  } catch (err) {
    next(err);
  }
}

export async function getLocationById(req, res, next) {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.status(200).json(location);
  } catch (err) {
    next(err);
  }
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'image',
    });

    return res.status(200).json({ imageUrl: result.secure_url });
  } catch (err) {
    next(err);
  }
}
