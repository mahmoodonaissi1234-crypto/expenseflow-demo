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
| GET    | /api/expenses        | Yes  | List your expenses    |
| POST   | /api/expenses        | Yes  | Create an expense     |
| PUT    | /api/expenses/:id    | Yes  | Update an expense     |
| DELETE | /api/expenses/:id    | Yes  | Delete an expense     |
| GET    | /api/categories       | Yes  | List your categories  |
| POST   | /api/categories       | Yes  | Create a category     |
| DELETE | /api/categories/:id   | Yes  | Delete a category     |

Send the JWT from login/register as `Authorization: Bearer <token>`.

Categories are per-user: each account gets a starter set (general, food, transport,
utilities, entertainment, other) on registration, and can add more from the
Categories page. Deleting a category that's still referenced by an expense returns
`409 Conflict` rather than cascading — reassign or delete those expenses first.
