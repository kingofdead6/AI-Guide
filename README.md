# The AI Guide Academy

```
client/   the course site (React 19 + Vite + Tailwind). See client/README.md for the content format.
server/   the API (Express + MongoDB): accounts, saved progress, admin endpoints.
```

## Setup

Requires Node 20 or newer and a MongoDB database (MongoDB Atlas works).

1. Put your connection string in `server/.env` as `MONGO_URI=...`. The file already has a generated `JWT_SECRET`.
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`. That account is created (or promoted to admin) when the server starts.
3. Install and run:

```bash
npm run install:all
npm run dev:server     # API on http://localhost:4000
npm run dev:client     # site on http://localhost:5173, /api is proxied to the server
```

Sign in with the admin account and open **Admin** in the header (or `#/admin`).

## Production

```bash
npm run build          # builds client/dist
npm start              # the server serves the API and client/dist on one port
```

If you host the client on a different domain, build it with `VITE_API_URL=https://your-api.example.com/api` and set `CLIENT_ORIGIN` in `server/.env` to the client's origin.

## How progress is saved

- Guests keep using the site exactly as before: progress lives in the browser.
- After signing in or registering, any progress made as a guest is merged into the account.
- Every change is saved to the server about a second later (and when the tab is hidden or closed). Offline changes are retried automatically.
- On another device, signing in loads the saved progress. Signing out clears it from that browser.

## API

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | anyone | `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | anyone | `{ email, password }` → `{ token, user }` |
| GET / PATCH | `/api/auth/me` | signed in | current user / change name |
| GET / PUT | `/api/progress` | signed in | load / save the progress document |
| GET | `/api/admin/stats` | admin | learner counts and activity |
| GET | `/api/admin/users?q=` | admin | all learners with a slim copy of their progress |
| GET | `/api/admin/users/:id` | admin | one learner with full progress |
| PATCH | `/api/admin/users/:id` | admin | `{ role: "user" \| "admin" }` |
| DELETE | `/api/admin/users/:id` | admin | delete a learner |

To grant or revoke admin access from the command line: `npm run make-admin --prefix server -- someone@example.com [--revoke]`.
