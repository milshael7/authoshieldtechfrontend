# AutoShieldTech Quick Deploy

This repo contains:
- Frontend (Vite + React) -> deploy to Vercel
- Backend (Node + Express) -> deploy to Render
- Trading terminal module (candles + wide screen) inside the frontend
- AI endpoints (stub) in the backend

## Local (Docker)
From the repo root:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000/health

## Vercel (Frontend)
1. Import the repo in Vercel
2. Set **Root Directory** to `frontend`
3. Add env var:
   - `VITE_API_BASE=https://YOUR_RENDER_BACKEND_URL`
4. Deploy

## Render (Backend)
1. Create a new Web Service in Render
2. Set **Root Directory** to `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Env vars:
   - `JWT_SECRET=...`
   - `CORS_ORIGINS=https://YOUR_VERCEL_DOMAIN.vercel.app,https://YOUR_CUSTOM_DOMAIN.com`
   - `AUTH_RATELIMIT_MAX=30` (optional)

## Routes
- Cybersecurity: default view after login
- Trading terminal: click **Trading** in the top nav
- Market WebSocket (stub): `wss://YOUR_RENDER_BACKEND/ws/market`
