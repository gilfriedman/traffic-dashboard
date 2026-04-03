# Traffic Dashboard

A full-stack web app for visualizing traffic congestion data in Beer Sheva, Israel. Built to analyze data collected by [gmaps-scraper](https://github.com/gilfriedman/gmaps-scraper) — ~76 routes across 6 neighborhoods.

## Stack

- **Backend**: Flask, MongoDB (Atlas), pymongo
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts

## Pages

- **Dashboard** — overview stats, neighborhood comparison, rush hour profile, congestion over time
- **Charts** — 5 tabs: time series, day-of-week, rush hour, route ranking, distribution (all filterable)
- **Data** — sortable table with pagination, filters, CSV/JSON export

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas connection string (from gmaps-scraper)

### Install

```bash
# Backend
pip install -r server/requirements.txt

# Frontend
cd client && npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### Run (development)

```bash
# Terminal 1 — Backend (port 5001)
python -m server.app

# Terminal 2 — Frontend (port 5173, proxies API to 5001)
cd client && npm run dev
```

### Run (production)

```bash
cd client && npm run build
python -m server.app
# App served at http://localhost:5001
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/routes` | List all routes |
| `GET /api/neighborhoods` | List all neighborhoods |
| `GET /api/traffic/data` | Paginated traffic data (with filters) |
| `GET /api/charts/*` | Chart aggregation endpoints (6 total) |
| `GET /api/export/csv` | Export filtered data as CSV |
| `GET /api/export/json` | Export filtered data as JSON |

## Project Structure

```
├── server/
│   ├── app.py                  # Flask entry point
│   ├── database.py             # MongoDB connection
│   ├── routes/                 # API route blueprints
│   ├── services/               # Aggregation pipelines, query building
│   └── utils/                  # Route-to-neighborhood mapping
├── client/
│   ├── src/
│   │   ├── pages/              # Dashboard, Charts, Data
│   │   ├── components/         # Charts, filters, layout
│   │   ├── hooks/              # Data fetching hooks
│   │   └── lib/                # API client, types, utils
│   └── vite.config.ts
└── .env.example
```
