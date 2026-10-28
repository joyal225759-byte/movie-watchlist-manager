import mongoose from 'mongoose';
export default mongoose.model('Sequence', new mongoose.Schema({
  year: { type: Number, unique: true, required: true },
  value: { type: Number, default: 0 }
}));
