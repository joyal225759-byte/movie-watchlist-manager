 # 🎬 CineTrack — Movie Watchlist Manager

**Every story worth watching, all in one place.**

CineTrack is a full-stack MERN application for organizing movies, tracking viewing progress, rating watched movies, and deciding what to watch next.

## Features

- **Movie management:** Add, view, edit, and delete movies.
- **Automatic movie codes:** Generate unique codes in the format `MV-<year>-<sequence>`.
- **Watch status tracking:** Manage movies as To Watch, Watching, or Watched.
- **Ratings:** Rate watched movies from 1 to 10.
- **Search and filters:** Find movies by title, genre, and status.
- **Pagination:** Display six movies per page.
- **Watch Next:** Recommend a high-priority movie, with shorter runtime used to break ties.
- **Dashboard statistics:** View status counts, total hours watched, average rating, and the most-watched genre.
- **Validation:** Prevent duplicate titles for the same release year and enforce workflow rules.
- **Responsive interface:** Use the application on desktop and mobile screens.

## Technology Stack

- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose
- **Version control:** Git and GitHub

## Project Structure

```text
movie-watchlist-manager/
├── backend/
│   ├── models/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- A MongoDB Atlas account and database connection string
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/joyal225759-byte/movie-watchlist-manager.git
cd movie-watchlist-manager
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder using `.env.example` as a guide. Configure your own MongoDB Atlas connection string and the required environment variables.

Start the backend:

```bash
npm run dev
```

The backend runs on port `5000` by default.

### 3. Configure the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

Create a `.env` file using `frontend/.env.example`. Configure the API URL:

```text
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm.cmd run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

**Note:** Keep your real `.env` files and database credentials private. Never commit actual secrets to GitHub.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API health |
| GET | `/api/movies` | List movies with search, filters, and pagination |
| POST | `/api/movies` | Add a movie |
| GET | `/api/movies/watch-next` | Recommend the next movie |
| GET | `/api/stats` | Retrieve dashboard statistics |
| PUT | `/api/movies/:id` | Edit permitted movie details |
| PATCH | `/api/movies/:id/status` | Update viewing status |
| PATCH | `/api/movies/:id/rating` | Update a watched movie's rating |
| DELETE | `/api/movies/:id` | Delete a movie when permitted |

API responses use a consistent JSON structure containing `success`, `message`, and `data` where applicable.

## Movie Workflow

- New movies begin in **To Watch**.
- Movies can move between To Watch and Watching.
- Marking a movie as Watched requires a rating from 1 to 10.
- Watched movies cannot return to an earlier status.
- Movies currently in Watching status cannot be deleted.
- Movie codes and release years cannot be changed through the edit endpoint.

## Screenshots

Add screenshots of the working application here:

- `screenshots/dashboard.png` — Dashboard and statistics
- `screenshots/movie-list.png` — Movie cards, search, and filters

## Author

Developed as a full-stack MERN project.
