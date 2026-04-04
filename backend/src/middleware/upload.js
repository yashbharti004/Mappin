import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';

const storage = multer.memoryStorage();

export const upload = multer({ storage });

export function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mappin', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}
