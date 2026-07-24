# ExpenseFlow

A simple expense tracker: React (Vite) frontend, Express API, Postgres database.

## Project layout

```
server/   Express API (auth + expense CRUD)
client/   React frontend (Vite)
```

## Prerequisites

- Node.js 18+
- Docker (for local Postgres) — or your own Postgres instance

## 1. Start Postgres

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with user/password/db all set to `expenseflow`
(see `docker-compose.yml`). If you already have Postgres running locally, skip this and
point the server's `.env` at it instead.

## 2. Set up and run the API server

```bash
cd server
cp .env.example .env
npm install
npm run db:migrate   # creates the users/expenses tables
npm run dev           # starts on http://localhost:4000
```

## 3. Set up and run the frontend

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev            # starts on http://localhost:5173
```

Open http://localhost:5173, register an account, and start adding expenses.

## Running both at once

After the one-time setup above (Postgres running, `.env` files in place, `npm install`
done in both `server/` and `client/`), you can start both processes together from the
repo root instead of using two terminals:

```bash
npm install   # first time only, installs the `concurrently` dev dependency
npm run dev
```

## API overview

| Method | Route              | Auth | Description          |
|--------|--------------------|------|-----------------------|
| POST   | /api/auth/register | No   | Create an account     |
| POST   | /api/auth/login     | No   | Log in, get a JWT     |
| GET    | /api/auth/me        | Yes  | Current user          |
| GET    | /api/expenses        | Yes  | List your expenses (supports `?categoryId=`, `?from=&to=`) |
| POST   | /api/expenses        | Yes  | Create an expense     |
| PUT/PATCH | /api/expenses/:id | Yes  | Update an expense (partial) |
| DELETE | /api/expenses/:id    | Yes  | Delete an expense     |
| GET    | /api/categories       | Yes  | List your categories  |
| POST   | /api/categories       | Yes  | Create a category     |
| DELETE | /api/categories/:id   | Yes  | Delete a category     |
| GET    | /api/dashboard/summary | Yes | Current-month total, spend by category, 5 most recent transactions |

Send the JWT from login/register as `Authorization: Bearer <token>`.

`/api/dashboard/summary`'s total spend and category breakdown are scoped to the
current calendar month; the recent-transactions list is the 5 most recent overall
(not month-scoped).

Categories are per-user: each account gets a starter set (general, food, transport,
utilities, entertainment, other) on registration, and can add more from the
Categories page. Deleting a category that's still referenced by an expense returns
`409 Conflict` rather than cascading — reassign or delete those expenses first.

## Deploying to Vercel

Local Docker Postgres only runs on your own machine — a Vercel deployment needs a
real hosted database it can reach over the network. `server/src/db.js` supports
this via a single `DATABASE_URL` (used instead of the local `PG*` vars when set).

1. **Import the repo into Vercel** — from the Vercel dashboard, "Add New" → "Project",
   pick this GitHub repo. `vercel.json` at the repo root already configures the
   monorepo split (`client/` as the static build, `server/src/index.js` as a
   serverless function handling `/api/*`, `/health`, `/ping`).
2. **Provision Postgres** — in the new project, go to the "Storage" tab → "Create
   Database" → choose a Postgres option (Neon-backed). This automatically adds a
   connection-string env var (commonly `DATABASE_URL` or `POSTGRES_URL`) to the
   project — check the exact name Vercel used and set `DATABASE_URL` to match if
   it's named differently.
3. **Set the remaining env vars** (Project → Settings → Environment Variables):
   - `JWT_SECRET` — any long random string
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `CLIENT_ORIGIN` — your Vercel deployment's URL (once you have it)
4. **Run the migration against the hosted database** — from your local machine,
   temporarily set `server/.env`'s `DATABASE_URL` to the same connection string
   Vercel is using, then run `cd server && npm run db:migrate`. This only needs
   to happen once (or again after a schema-changing update).
5. **Deploy** and open the live URL. Run through: register → log in → add a
   category → add an expense → view the dashboard → log out, on the live site
   (not localhost) to confirm the full flow works end-to-end in production.
