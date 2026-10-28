# Movie Watchlist Manager

MERN application for managing a movie watchlist.

## Setup
1. Install Node.js and create a MongoDB Atlas database.
2. In `backend/.env`, set `MONGODB_URI` to your own test database URI and set `PORT=5000`, `CLIENT_URL=http://localhost:5173`.
3. In `frontend/.env`, set `VITE_API_URL=http://localhost:5000/api`.
4. Run `npm install` in `backend` and `frontend` separately.
5. Start backend with `npm run dev`; start frontend with `npm run dev`.

Never commit real database credentials. Replace the placeholder in `backend/.env` before running. `.env.example` files document required variables.

## APIs
- `GET /api/movies` — list/filter/search/paginate (`status`, `genre`, `search`, `page`)
- `POST /api/movies` — add movie
- `PUT /api/movies/:id` — edit editable fields
- `PATCH /api/movies/:id/status` — change status; rating required when marking Watched
- `PATCH /api/movies/:id/rating` — edit rating for Watched movie only
- `DELETE /api/movies/:id` — delete unless Watching
- `GET /api/movies/watch-next` — highest-priority To Watch movie, then shortest runtime
- `GET /api/stats` — dashboard statistics

All responses use `{ success, message, data }`. List response data contains `movies`, `page`, `totalPages`, and `totalMovies`.

## Screenshots
Add two screenshots of the running app here before submission:
- `screenshots/dashboard.png`
- `screenshots/movie-form.png`
