# WeatherGuard Admin

An invite-only weather alert service. Users sign up with Google or GitHub,
an admin manually approves access, and approved users get automated weather
alerts pushed to them on Telegram.

```
weatherguard-admin/
├── api/      NestJS backend (auth, approvals, scheduling, Telegram bot)
└── admin/    React + Tailwind admin dashboard
```

## How it works, end to end

1. A user signs in with Google or GitHub. This creates an account with
   `status: "pending"` — there is no path that creates an already-approved
   account.
2. The user sets an alert location and connects Telegram via a one-time
   deep link, while waiting on a "pending approval" screen.
3. An admin opens the dashboard, sees the request in the **Pending
   Requests** queue, and clicks **Approve** (or **Reject**).
4. A scheduled job runs every 30 minutes. It looks up everyone who is
   currently `approved` **and** has a linked Telegram chat, fetches the
   weather for their saved location, and sends an alert if conditions are
   alert-worthy.
5. If an admin revokes access later, that user simply stops showing up in
   the next sweep's query — nothing else needs to be updated or cleared.

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

`AlertLog` is an audit trail only — it is never read from when deciding who
to alert. That decision is always made fresh against `User.status`.

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

Each module is self-contained and only exports what other modules need
(e.g. `UsersModule` exports `UsersService`, nothing else reaches into its
internals). `AlertsModule` is the only place that combines `UsersService`,
`WeatherService`, and `TelegramService` — that composition is intentional,
since dispatching an alert is the one operation that genuinely needs all
three.

## Data flow: how only approved users receive alerts

This is the part worth being explicit about, since it's the core security
property of the whole system.

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

The BullMQ worker (`alerts.processor.ts`) calls this query *at the moment
the job runs*, not from a cached list built earlier. That matters for two
reasons:

- **No stale state.** If an admin approves or revokes a user between when
  the job was scheduled and when it executes, the query reflects the
  current value, since it's a fresh read against MongoDB every time the
  sweep runs.
- **No second code path.** Approval (`PATCH /users/:id/status`) only ever
  flips one field — `status`. It doesn't touch a separate "subscriptions"
  table or a cache that could drift out of sync with the real status. There
  is nothing else to keep in sync, so there's nothing else that can leak.

The Telegram side reinforces this rather than weakening it: a user can link
Telegram while still `pending` (so they don't have to wait around once
approved), but linking only stores `telegramChatId` — it never touches
`status`. A linked-but-pending user still won't appear in
`findApprovedWithTelegram()` until an admin explicitly approves them.

Authorization on the API side follows the same single-source-of-truth
principle: `RolesGuard` reads `role` off the authenticated user (attached by
`JwtStrategy`, which loads the user fresh from MongoDB on every request), so
admin-only routes like the approval endpoint can't be reached by a
non-admin even if they have a valid session.

## Telegram linking flow

1. User clicks **Connect Telegram** in the dashboard.
2. API generates a random one-time token, stores it on the user as
   `telegramLinkToken`, and returns `https://t.me/<bot>?start=<token>`.
3. Telegram opens a chat with the bot and sends `/start <token>`.
4. The bot looks up the user by that token, saves `chatId`, and clears
   `telegramLinkToken` so the link can't be reused.

No phone numbers, no manual chat ID entry — this is the same pattern most
"connect your Telegram" integrations use.

## Running locally

### Prerequisites
- Node 20+
- MongoDB running locally (or a connection string)
- Redis running locally (required by BullMQ)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- OAuth apps registered with Google and GitHub

### Setup

```bash
git clone <this-repo>
cd weatherguard-admin
npm install   # installs both workspaces

cp api/.env.example api/.env      # fill in Mongo/Redis/OAuth/Telegram values
cp admin/.env.example admin/.env  # only needed for non-proxied prod builds
```

### Run

```bash
# Terminal 1
npm run api:dev      # NestJS API on :3000

# Terminal 2
npm run admin:dev    # React admin on :5173 (proxies /api -> :3000)
```

Open `http://localhost:5173`, sign in, and the first account you want as an
admin needs `role: "admin"` set directly in MongoDB (there's intentionally
no self-service "become an admin" button).

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

### OAuth callback URLs to register

- Google: `http://localhost:3000/auth/google/callback`
- GitHub: `http://localhost:3000/auth/github/callback`

## Tech stack

| Layer | Choice |
|---|---|
| API | NestJS (modular), MongoDB/Mongoose, BullMQ + Redis, Passport (Google/GitHub/JWT), Telegraf |
| Frontend | React + Vite, Tailwind CSS v4, React Router |
| Weather data | [Open-Meteo](https://open-meteo.com/) — free, no API key |
