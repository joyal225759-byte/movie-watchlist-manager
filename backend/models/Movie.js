import mongoose from 'mongoose';

export const genres = ['Action','Comedy','Drama','Horror','Sci-Fi','Romance','Thriller'];
export const platforms = ['Netflix','Prime Video','Hotstar','Theatre','Other'];
export const statuses = ['To Watch','Watching','Watched'];

const movieSchema = new mongoose.Schema({
  movieCode: { type: String, required: true, unique: true, immutable: true },
  title: { type: String, required: true, trim: true },
  titleKey: { type: String, required: true },
  genre: { type: String, enum: genres, required: true },
  releaseYear: { type: Number, required: true, min: 1950, max: new Date().getFullYear(), immutable: true },
  runtime: { type: Number, required: true, min: 30, max: 300 },
  platform: { type: String, enum: platforms, required: true },
  priority: { type: Number, required: true, min: 1, max: 5 },
  status: { type: String, enum: statuses, default: 'To Watch', required: true },
  rating: { type: Number, min: 1, max: 10, default: null },
  watchedDate: { type: Date, default: null }
}, { timestamps: true });

movieSchema.index({ titleKey: 1, releaseYear: 1 }, { unique: true });
movieSchema.index({ releaseYear: 1, movieCode: 1 }, { unique: true });
export default mongoose.model('Movie', movieSchema);
