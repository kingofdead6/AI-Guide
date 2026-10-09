# The AI Guide Academy

```
client/   the course site (React 19 + Vite + Tailwind). See client/README.md for the content format.
server/   the API (Express + MongoDB): accounts, saved progress, admin endpoints.
mobile/   the Flutter app for Android and iOS, using the same API and progress. See mobile/README.md.
```

## Deployed API

Both the website and the mobile app use the API at **https://ai-guide-uo4m.onrender.com** by default
(`client/src/lib/api.ts` and `mobile/lib/core/api.dart`).

That server only serves the API, so the browser needs CORS permission. On Render, set the environment variable
`CLIENT_ORIGIN` to the website's address plus local development, for example
`CLIENT_ORIGIN=https://your-website.example,http://localhost:5173`, or `CLIENT_ORIGIN=*` to allow any origin
(safe here because sign-in uses bearer tokens, not cookies). The mobile app is not affected by CORS.

To work against a local server instead, create `client/.env.local` with `VITE_API_URL=/api` and run the app with
`flutter run --dart-define=API_URL=http://10.0.2.2:4000`.

## Setup (local server)

Requires Node 20 or newer and a MongoDB database (MongoDB Atlas works).

1. Put your connection string in `server/.env` as `MONGO_URI=...`. The file already has a generated `JWT_SECRET`.
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`. That account is created (or promoted to admin) when the server starts.
3. Install and run:

```bash
npm run install:all
npm run dev:server     # API on http://localhost:4000 (entry: server/index.js)
npm run dev:client     # site on http://localhost:5173 (uses the Render API unless VITE_API_URL=/api)
```

Sign in with the admin account: it only sees the admin panel (learners, deletion requests, account settings), never the learning site.

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
| POST | `/api/auth/password` | signed in | `{ currentPassword, newPassword }`; signs out other devices |
| POST / DELETE | `/api/auth/deletion-request` | learner | request / cancel account deletion (`{ reason }`) |
| GET / PUT | `/api/progress` | signed in | load / save the progress document |
| GET | `/api/admin/stats` | admin | learner counts and activity |
| GET | `/api/admin/users?q=` | admin | all learners with a slim copy of their progress |
| GET | `/api/admin/users/:id` | admin | one learner with full progress |
| PATCH | `/api/admin/users/:id` | admin | `{ role: "user" \| "admin" }` |
| DELETE | `/api/admin/users/:id` | admin | delete a learner |
| GET | `/api/admin/deletion-requests` | admin | pending deletion requests |
| DELETE | `/api/admin/deletion-requests/:id` | admin | dismiss a request and keep the account |

To grant or revoke admin access from the command line: `npm run make-admin --prefix server -- someone@example.com [--revoke]`.
