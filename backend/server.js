import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Movie, { genres, platforms, statuses } from './models/Movie.js';
import Sequence from './models/Sequence.js';

dotenv.config();
const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://movie-watchlist-manager-1-jz54.onrender.com'
];

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

const send = (res, status, success, message, data = null) => res.status(status).json({ success, message, data });
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const validRating = n => Number.isInteger(n) && n >= 1 && n <= 10;
const currentYear = new Date().getFullYear();

app.get('/api/health', (req,res) => send(res,200,true,'API is running',{status:'ok'}));

app.post('/api/movies', asyncRoute(async (req,res) => {
  const { title, genre, releaseYear, runtime, platform, priority } = req.body;
  if (!title?.trim() || !genres.includes(genre) || !platforms.includes(platform) ||
      !Number.isInteger(Number(releaseYear)) || Number(releaseYear) < 1950 || Number(releaseYear) > currentYear ||
      !Number.isInteger(Number(runtime)) || Number(runtime) < 30 || Number(runtime) > 300 ||
      !Number.isInteger(Number(priority)) || Number(priority) < 1 || Number(priority) > 5) {
    return send(res,400,false,'Please provide valid movie details. Year: 1950–current year, runtime: 30–300, priority: 1–5.');
  }
  const titleKey = title.trim().toLocaleLowerCase();
  if (await Movie.findOne({ titleKey, releaseYear: Number(releaseYear) })) return send(res,409,false,'A movie with this title and release year already exists.');
  // Atomic per-year increment. Sequence may have gaps if a later insert fails, but never reuses a code.
  const seq = await Sequence.findOneAndUpdate({year:Number(releaseYear)}, {$inc:{value:1}}, {new:true,upsert:true,setDefaultsOnInsert:true});
  const movieCode = `MV-${releaseYear}-${String(seq.value).padStart(3,'0')}`;
  try {
    const movie = await Movie.create({ movieCode, title:title.trim(), titleKey, genre, releaseYear:Number(releaseYear), runtime:Number(runtime), platform, priority:Number(priority), status:'To Watch' });
    return send(res,201,true,'Movie added successfully.',movie);
  } catch (e) {
    if (e.code === 11000) return send(res,409,false,'A movie with this title and release year already exists.');
    throw e;
  }
}));

app.get('/api/movies/watch-next', asyncRoute(async (req,res) => {
  const movie = await Movie.findOne({status:'To Watch'}).sort({priority:-1,runtime:1,createdAt:1});
  if (!movie) return send(res,404,false,'No movies are currently in To Watch status.');
  send(res,200,true,'Here is what you should watch next.',movie);
}));

app.get('/api/movies', asyncRoute(async (req,res) => {
  const {status,genre,search=''} = req.query;
  const page = Math.max(1, parseInt(req.query.page,10) || 1), limit = 6;
  const filter = {};
  if (status && statuses.includes(status)) filter.status = status;
  if (genre && genres.includes(genre)) filter.genre = genre;
  if (search.trim()) filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), $options:'i' };
  const totalMovies = await Movie.countDocuments(filter);
   const movies = await Movie.aggregate([
  { $match: filter },
  {
    $addFields: {
      statusOrder: {
        $switch: {
          branches: [
            { case: { $eq: ['$status', 'To Watch'] }, then: 0 },
            { case: { $eq: ['$status', 'Watching'] }, then: 1 },
            { case: { $eq: ['$status', 'Watched'] }, then: 2 }
          ],
          default: 3
        }
      }
    }
  },
  { $sort: { statusOrder: 1, priority: -1, runtime: 1, createdAt: -1 } },
  { $skip: (page - 1) * limit },
  { $limit: limit }
]);
  send(res,200,true,'Movies fetched successfully.',{movies,page,totalPages:Math.ceil(totalMovies/limit),totalMovies});
}));

app.get('/api/stats', asyncRoute(async (req,res) => {
  const [statusCounts, watched, genreCounts] = await Promise.all([
    Movie.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]),
    Movie.aggregate([{$match:{status:'Watched'}},{$group:{_id:null,totalRuntime:{$sum:'$runtime'},avgRating:{$avg:'$rating'},count:{$sum:1}}}]),
    Movie.aggregate([{$match:{status:'Watched'}},{$group:{_id:'$genre',count:{$sum:1}}},{$sort:{count:-1,_id:1}},{$limit:1}])
  ]);
  const counts = {'To Watch':0,Watching:0,Watched:0};
  statusCounts.forEach(x=>counts[x._id]=x.count);
  const w = watched[0] || {totalRuntime:0,avgRating:null,count:0};
  send(res,200,true,'Statistics fetched successfully.',{
    statusCounts:counts,totalHoursWatched:Math.round((w.totalRuntime/60)*10)/10,
    averageRating:w.avgRating == null ? null : Math.round(w.avgRating*10)/10,
    topWatchedGenre:genreCounts[0] ? {genre:genreCounts[0]._id,count:genreCounts[0].count} : null
  });
}));

app.put('/api/movies/:id', asyncRoute(async (req,res) => {
  const {title,genre,runtime,platform,priority} = req.body;
  const movie = await Movie.findById(req.params.id);
  if (!movie) return send(res,404,false,'Movie not found.');
  if (movie.status === 'Watched') {
    // Editing metadata is permitted; status, code, year, watchedDate and rating are not editable here.
  }
  if (!title?.trim() || !genres.includes(genre) || !platforms.includes(platform) ||
      !Number.isInteger(Number(runtime)) || Number(runtime)<30 || Number(runtime)>300 ||
      !Number.isInteger(Number(priority)) || Number(priority)<1 || Number(priority)>5)
    return send(res,400,false,'Invalid editable movie details.');
  const titleKey = title.trim().toLocaleLowerCase();
  if (await Movie.findOne({_id:{$ne:movie._id},titleKey,releaseYear:movie.releaseYear}))
    return send(res,409,false,'A movie with this title and release year already exists.');
  movie.title=title.trim(); movie.titleKey=titleKey; movie.genre=genre; movie.runtime=Number(runtime); movie.platform=platform; movie.priority=Number(priority);
  await movie.save();
  send(res,200,true,'Movie updated successfully.',movie);
}));

app.patch('/api/movies/:id/status', asyncRoute(async (req,res) => {
  const {status,rating} = req.body;
  if (!statuses.includes(status)) return send(res,400,false,'Invalid status.');
  const movie = await Movie.findById(req.params.id);
  if (!movie) return send(res,404,false,'Movie not found.');
  const allowed = {'To Watch':['Watching','Watched'],Watching:['Watched','To Watch'],Watched:[]};
  if (!allowed[movie.status].includes(status)) return send(res,400,false,`Invalid status transition: ${movie.status} → ${status}.`);
  if (status === 'Watched') {
    if (!validRating(Number(rating))) return send(res,400,false,'A rating from 1 to 10 is required when marking a movie as Watched.');
    movie.rating=Number(rating); movie.watchedDate=new Date();
  } else {
    if (rating !== undefined && rating !== null && rating !== '') return send(res,400,false,'Rating is only allowed for Watched movies.');
    movie.rating=null; movie.watchedDate=null;
  }
  movie.status=status; await movie.save();
  send(res,200,true,'Movie status updated successfully.',movie);
}));

app.patch('/api/movies/:id/rating', asyncRoute(async (req,res) => {
  const rating = Number(req.body.rating);
  if (!validRating(rating)) return send(res,400,false,'Rating must be an integer from 1 to 10.');
  const movie = await Movie.findById(req.params.id);
  if (!movie) return send(res,404,false,'Movie not found.');
  if (movie.status !== 'Watched') return send(res,400,false,'Only Watched movies can be rated.');
  movie.rating=rating; await movie.save();
  send(res,200,true,'Rating updated successfully.',movie);
}));

app.delete('/api/movies/:id', asyncRoute(async (req,res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return send(res,404,false,'Movie not found.');
  if (movie.status === 'Watching') return send(res,400,false,'Movies currently Watching cannot be deleted.');
  await movie.deleteOne();
  send(res,200,true,'Movie deleted successfully.',movie);
}));

app.use((req,res) => send(res,404,false,'API endpoint not found.'));
app.use((err,req,res,next) => {
  console.error(err);
  if (err.name === 'CastError') return send(res,400,false,'Invalid movie ID.');
  if (err.name === 'ValidationError') return send(res,400,false,err.message);
  send(res,500,false,'An unexpected server error occurred.');
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>app.listen(port,()=>console.log(`API running on port ${port}`)))
  .catch(err=>{ console.error('MongoDB connection failed:',err.message); process.exit(1); });
