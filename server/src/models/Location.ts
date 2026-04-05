import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  type: string;
  title: string;
  description: string;
  images: string[];
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  metadata: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

const LocationSchema: Schema = new Schema({
  type: { type: String, enum: ['creator_post', 'furniture', 'generic'], default: 'generic' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], default: [] },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Explicit 2dsphere index required for map boundary / radius fetching
LocationSchema.index({ location: '2dsphere' });

export default mongoose.model<ILocation>('Location', LocationSchema);
