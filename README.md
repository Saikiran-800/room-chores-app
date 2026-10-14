# room-chores-app

Remix (Vite) frontend for Room Chores. It talks to [`room-chores-svc`](../room-chores-svc) from the Remix server
(loaders/actions), so the browser never calls the API directly and there is no CORS to configure for this app.

## Run locally

Requirements: Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173
```

The API URL defaults to `http://localhost:8080`. To point somewhere else:

```bash
API_URL=https://my-api.example.com npm run dev
```

Start the backend first (see its README), otherwise every page shows a "Can't reach the API" message.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Monthly fairness: earned vs fair-share points per roommate |
| `/assignments` | Week view, generate a day's chores, mark done / missed, swap with an eligible roommate |
| `/chores` | Catalog grouped by category, edit points, enable/disable, add chores |
| `/roommates` | Add roommates, set capacity % and skills, deactivate |

## Build for production

```bash
npm run build
npm start            # remix-serve on port 3000
```

## Layout

```
app/
  root.tsx            shell, nav, error boundary
  styles.css          all styling (light/dark)
  lib/api.server.ts   fetch wrapper + error handling (server only)
  lib/types.ts        API types
  routes/             one file per page
```
