# 📍 Mappin

A map-based geo-content platform where users can add, explore, and interact with location-tagged content (images + descriptions).

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Mapbox GL JS + React Query
- **Backend**: Node.js + Express + MongoDB (with geospatial indexing)
- **Image Storage**: Cloudinary

## Project Structure

```
mappin/
├── frontend/   # Next.js 14 app
└── backend/    # Express API
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Mapbox account (free token)
- Cloudinary account (free tier)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your Mapbox token and API URL in .env.local
npm run dev
```

The frontend runs on http://localhost:3000 and the backend on http://localhost:5000.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Express server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:5000) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/locations` | Fetch locations (supports `bounds` + `type` query params) |
| `POST` | `/api/locations` | Create a new location |
| `GET` | `/api/locations/:id` | Get a single location by ID |
| `POST` | `/api/locations/upload-image` | Upload an image to Cloudinary |
| `GET` | `/health` | Health check |

## Features

- 🗺️ Full-screen Mapbox map with light style
- 📌 Custom blue glow markers for each location
- ➕ Click map to add a new location (with image upload)
- 🗂️ Location detail side panel (desktop) / bottom sheet (mobile)
- 🔍 Draggable snap-point bottom sheet with peek / mid / full states
- 📸 Cloudinary image upload
- 🔄 React Query for optimistic UI updates
- 📡 Geospatial indexing for bounds-based queries
- 🌍 Auto-centers on user's location (falls back to Nagpur)
