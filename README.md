# WeatherGuard Admin

An invite-only weather alert service. Users sign up with Google or GitHub, an admin manually approves access, and approved users get automated weather alerts pushed to them on Telegram.

**Live demo:** [weatherguard--admin.vercel.app](https://weatherguard--admin.vercel.app)

```
weatherguard-admin/
├── api/      NestJS backend (auth, approvals, scheduling, Telegram bot)
└── admin/    React + Tailwind admin dashboard
```

---

## How it works, end to end

1. A user signs in with Google or GitHub. This creates an account with `status: "pending"` — there is no path that creates an already-approved account.
2. The user sets an alert location and connects Telegram via a one-time deep link, while waiting on a "pending approval" screen.
3. An admin opens the dashboard, sees the request in the **Pending Requests** queue, and clicks **Approve** (or **Reject**).
4. A scheduled job runs every 30 minutes. It looks up everyone who is currently `approved` **and** has a linked Telegram chat, fetches the weather for their saved location, and sends an alert if conditions are alert-worthy.
5. If an admin revokes access later, that user simply stops showing up in the next sweep's query — nothing else needs to be updated or cleared.

---

## System design

### Database schema (MongoDB / Mongoose)

**`User`**

| Field | Type | Notes |
|---|---|---|
| `email` | string | unique |
| `name` | string | |
| `avatarUrl` | string | from OAuth profile |
| `provider` | `'google' \| 'github'` | |
| `providerId` | string | the OAuth provider's user id |
| `role` | `'user' \| 'admin'` | default `'user'` |
| `status` | `'pending' \| 'approved' \| 'rejected'` | default `'pending'` — **the single gate for alert eligibility** |
| `telegramChatId` | string? | set once the user links Telegram |
| `telegramLinkToken` | string? | one-time token for the `/start` deep link, cleared on use |
| `location` | `{ name, lat, lon }`? | where alerts are sent for |
| `createdAt` / `updatedAt` | Date | |

**`AlertLog`**

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → `User` | |
| `status` | `'sent' \| 'failed'` | |
| `payload` | object? | weather snapshot that triggered the alert |
| `error` | string? | failure reason, if any |
| `createdAt` | Date | |

`AlertLog` is an audit trail only — it is never read from when deciding who to alert. That decision is always made fresh against `User.status`.

### API modules (NestJS)

```
src/
├── auth/        Google & GitHub OAuth strategies, JWT issuance, login/logout
├── users/       profile, location, Telegram link-token, admin approve/reject
├── weather/     Open-Meteo client (no API key required)
├── telegram/    Telegraf bot: handles /start deep links, sends alerts
├── alerts/      BullMQ queue, scheduler, worker, manual trigger, audit log
└── common/      shared guards (JWT, roles), decorators, schemas
```

Each module is self-contained and only exports what other modules need. `AlertsModule` is the only place that combines `UsersService`, `WeatherService`, and `TelegramService` — that composition is intentional, since dispatching an alert is the one operation that genuinely needs all three.

---

## Data flow: how only approved users receive alerts

**There is exactly one query that decides who gets an alert:**

```ts
// users.service.ts
findApprovedWithTelegram() {
  return this.userModel.find({
    status: 'approved',
    telegramChatId: { $exists: true, $ne: null },
  });
}
```

The BullMQ worker calls this query *at the moment the job runs*, not from a cached list. That means:

- **No stale state.** If an admin revokes a user between scheduling and execution, the query reflects the current value.
- **No second code path.** Approval only ever flips one field — `status`. Nothing else can drift out of sync.

A user can link Telegram while still `pending`, but linking only stores `telegramChatId` — it never touches `status`. A linked-but-pending user won't appear in `findApprovedWithTelegram()` until an admin explicitly approves them.

---

## Telegram linking flow

1. User clicks **Connect Telegram** in the dashboard.
2. API generates a random one-time token, stores it as `telegramLinkToken`, and returns `https://t.me/<bot>?start=<token>`.
3. Telegram opens a chat with the bot and sends `/start <token>`.
4. The bot looks up the user by that token, saves `chatId`, and clears `telegramLinkToken` so it cannot be reused.

---

## Running locally

### Prerequisites
- Node 20+
- MongoDB running locally
- Redis running locally (required by BullMQ)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- OAuth apps registered with Google and GitHub

### Setup

```bash
git clone https://github.com/lightningMcQueen-95/weatherguard-admin
cd weatherguard-admin
npm install

cp api/.env.example api/.env
# Fill in all values in api/.env
```

### Environment variables (`api/.env`)

```env
PORT=3000
NODE_ENV=development
ADMIN_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/weatherguard

JWT_SECRET=your-long-random-string
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

REDIS_HOST=localhost
REDIS_PORT=6379

WEATHER_PROVIDER=open-meteo
```

### Run

```bash
# Terminal 1 — API
npm run api:dev      # NestJS on :3000

# Terminal 2 — Admin dashboard
npm run admin:dev    # React on :5173
```

Open `http://localhost:5173`. The first admin account must be set manually in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

### OAuth callback URLs (local)
- Google: `http://localhost:3000/auth/google/callback`
- GitHub: `http://localhost:3000/auth/github/callback`

---

## Deploying to production

### Architecture
| Service | Host |
|---|---|
| `/admin` (React frontend) | Vercel |
| `/api` (NestJS API + bot + scheduler) | Railway |
| MongoDB | Railway (managed) |
| Redis | Railway (managed) |

### Railway (API)

1. Create a new Railway project
2. Add **MongoDB** and **Redis** database services
3. Add a new service from your GitHub repo — set Root Directory to `api`
4. Add all environment variables (use Railway's variable references for MongoDB/Redis):

```env
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
NODE_ENV=production
ADMIN_URL=https://your-vercel-url.vercel.app
GOOGLE_CALLBACK_URL=https://your-railway-url.railway.app/auth/google/callback
GITHUB_CALLBACK_URL=https://your-railway-url.railway.app/auth/github/callback
# ... plus JWT, Google, GitHub, Telegram values
```

5. Add the Railway callback URLs to your Google Cloud Console and GitHub OAuth app

### Vercel (Frontend)

1. Import the repo on Vercel
2. Set Root Directory to `admin`
3. Framework preset: **Vite**
4. Add environment variable:
```env
VITE_API_URL=https://your-railway-url.railway.app
```

### Auth note

Production uses **Bearer token auth** (JWT in `localStorage`) rather than cookies, since the frontend and API are on different domains. The OAuth callback redirects to `/auth/callback?token=<jwt>` on the frontend, which stores the token and redirects to the dashboard.

---

## Tech stack

| Layer | Choice |
|---|---|
| API | NestJS (modular), MongoDB/Mongoose, BullMQ + Redis, Passport (Google/GitHub/JWT), Telegraf |
| Frontend | React + Vite, Tailwind CSS v4, React Router |
| Weather data | [Open-Meteo](https://open-meteo.com/) — free, no API key required |
| Deployment | Railway (API + databases), Vercel (frontend) |
