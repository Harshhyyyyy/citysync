# CitySync v0.6 — Vercel + Supabase Ready

CitySync is a GIS-based urban infrastructure decision-support prototype for Greater Noida.

This version is prepared for **one Vercel project** containing:

- React + Vite frontend
- FastAPI backend
- PostgreSQL + PostGIS database hosted separately on Supabase

Vercel can deploy multiple frameworks in one project using Vercel Services, so the frontend and FastAPI backend can share one deployment/domain. The database remains external because Vercel is the compute/deployment layer, not the PostGIS database itself. Vercel documents FastAPI as a supported Python backend and Vercel Services as the multi-framework option. Supabase provides managed PostgreSQL with PostGIS. 

## 1. Create the database first

1. Create a project at Supabase.
2. Open **Database → Extensions**.
3. Enable **PostGIS**.
4. Open **SQL Editor**.
5. Run `database/supabase_setup.sql` if you want to enable/check it through SQL.

PostGIS is required because CitySync stores roads as `LINESTRING`, locations as `POINT`, and areas as `POLYGON`.

## 2. Connect CitySync to Supabase

In Supabase, copy the PostgreSQL connection string for your database.

In Vercel, add this Environment Variable:

```text
DATABASE_URL=postgresql://...
```

The CitySync backend automatically converts normal `postgresql://` or `postgres://` URLs to the psycopg v3 SQLAlchemy driver and enables TLS for non-local databases.

Use the connection string intended for application/server connections. Never commit the password to GitHub.

## 3. Deploy to Vercel

### Easiest method — GitHub

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository.
3. In Vercel, choose **Add New → Project**.
4. Import the GitHub repository.
5. Keep the repository root as the project root.
6. Deploy.

`vercel.json` configures two Vercel Services:

- `frontend` → Vite
- `backend` → FastAPI (`app.main:app`)

Requests to `/api/*` are routed to FastAPI; everything else is routed to the React frontend.

## 4. Seed the demo GIS data

The FastAPI startup creates the SQLAlchemy tables after PostGIS is available.

After the first successful deployment, run `database/seed_vercel.sql` in the Supabase SQL Editor.

Then verify:

```text
https://YOUR-APP.vercel.app/api/health
https://YOUR-APP.vercel.app/api/map/health
https://YOUR-APP.vercel.app/api/map/layers
https://YOUR-APP.vercel.app/api/map/data
https://YOUR-APP.vercel.app/api/issues
```

The `/api/map/health` endpoint should return a PostGIS version.

## 5. Frontend/API behavior

The frontend now uses:

```text
/api
```

by default, instead of hard-coding `localhost:8000`.

That means the deployed app uses the same Vercel domain for both UI and API. During normal local Vite development, `vite.config.js` proxies `/api` to `http://localhost:8000`.

You can still override the API with:

```text
VITE_API_URL=https://example.com/api
```

## 6. Local development remains available

For local development, Docker PostGIS is still supported:

```powershell
docker compose up -d
```

Backend:

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
npm.cmd install
npm.cmd run dev
```

The Vite proxy sends `/api/*` to the local FastAPI server.

## Architecture

```text
                         ┌─────────────────────┐
                         │       Vercel         │
                         │                     │
                         │  React + Vite       │
                         │        │            │
                         │      /api/*         │
                         │        ↓            │
                         │  FastAPI backend    │
                         └─────────┬───────────┘
                                   │
                                   │ DATABASE_URL
                                   ↓
                         ┌─────────────────────┐
                         │      Supabase       │
                         │ PostgreSQL + PostGIS│
                         └─────────────────────┘
```

## Important

- Vercel hosts the application/frontend/backend; **PostGIS still needs a managed database** such as Supabase.
- Do not upload `.env` files containing database passwords.
- Do not put `DATABASE_URL` into frontend variables such as `VITE_DATABASE_URL`; Vite variables are exposed to browser code.
- PostGIS must be enabled before the backend can create its geometry columns.
- The application remains a decision-support platform. AI/analytics can be added as a later layer rather than claiming that AI autonomously manages a city.

## v0.6 changes

- Vercel Services configuration added.
- Vite frontend and FastAPI backend deploy together.
- Same-origin `/api` frontend calls.
- Local Vite API proxy added.
- Supabase/PostGIS production setup files added.
- Production database URL normalization and TLS handling added.
- SQLAlchemy timestamp server defaults added for reliable SQL seeding.
- Python 3.13/3.14-compatible dependency constraints added.
