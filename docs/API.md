# LicenseServer — API Documentation

Base URL: `http://localhost:4000/api/v1` (or `https://your-domain.com/api/v1` in production, or via Nginx at `/api/v1`)

All responses follow this envelope:

```json
{ "success": true, "message": "...", "data": { }, "error": "..." }
```

Authenticated routes require header: `Authorization: Bearer <accessToken>`

---

## Auth

### POST `/auth/login`
Body: `{ "email": "admin@licenseserver.com", "password": "Admin@123456" }` (or `"username"` instead of `"email"`)

Response `data`: `{ "user": {...}, "tokens": { "accessToken", "refreshToken", "expiresIn" } }`

Rate limited to 10 attempts / 15 minutes per IP.

### POST `/auth/logout` 🔒
Body: `{ "refreshToken": "..." }` — invalidates the refresh token and active session.

### POST `/auth/refresh`
Body: `{ "refreshToken": "..." }` — returns a new token pair. The old refresh token is revoked (rotation).

### GET `/auth/profile` 🔒
Returns the authenticated user's full profile including license/transaction counts.

---

## Users 🔒 (Admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/users` | Paginated list (`?page&limit&search&role&isActive&sortBy&sortOrder`) |
| GET | `/users/:id` | Single user |
| POST | `/users` | Create user `{ username, email, password, role?, balance? }` |
| PUT | `/users/:id` | Update user `{ username?, email?, password?, role?, isActive?, avatar? }` |
| DELETE | `/users/:id` | Delete user (cannot delete ADMIN role) |
| POST | `/users/:id/balance` | Adjust balance `{ amount, type: "TOPUP"\|"DEDUCT", description? }` |

---

## Licenses 🔒

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/licenses` | Admin/Reseller | Paginated list (`?status&type&userId&productId&search`) |
| GET | `/licenses/my` | Any user | Your own assigned licenses |
| GET | `/licenses/:id` | Admin/Reseller | Single license w/ devices |
| POST | `/licenses` | Admin/Reseller | `{ productId, userId?, type, expiresAt?, maxDevices?, note? }` |
| POST | `/licenses/bulk` | Admin/Reseller | `{ productId, type, count (≤500), expiresAt?, maxDevices?, note? }` |
| PUT | `/licenses/:id` | Admin/Reseller | Update any field |
| DELETE | `/licenses/:id` | Admin only | Permanently delete |
| POST | `/licenses/:id/suspend` | Admin/Reseller | Set status → SUSPENDED |
| POST | `/licenses/:id/resume` | Admin/Reseller | Set status → ACTIVE |
| POST | `/licenses/validate` | Any authenticated client | `{ key, deviceId }` — validates + registers device, enforces device limit & expiry |

`type` is one of `PERMANENT`, `TIME_LIMITED`, `TRIAL`. `status` is one of `ACTIVE`, `SUSPENDED`, `EXPIRED`, `REVOKED`, `PENDING`.

---

## Products 🔒

| Method | Path | Access |
|---|---|---|
| GET | `/products` | Any |
| GET | `/products/:id` | Any |
| POST | `/products` | Admin |
| PUT | `/products/:id` | Admin |
| DELETE | `/products/:id` | Admin (blocked if licenses exist) |

---

## Transactions 🔒

| Method | Path | Description |
|---|---|---|
| GET | `/transactions` | Admin sees all (`?userId&type`); regular users see only their own |
| GET | `/transactions/:id` | Single transaction (owner or admin) |

`type` is one of `TOPUP`, `DEDUCT`, `TRANSFER_IN`, `TRANSFER_OUT`, `LICENSE_PURCHASE`, `REFUND`.

---

## Analytics 🔒 (Admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/analytics` | Dashboard summary: totals, revenue, 6-month charts, recent activity, online users |
| GET | `/analytics/transactions?period=week\|month\|year` | Transaction breakdown by type for the period |

---

## Settings 🔒 (Admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/settings` | All settings grouped by category |
| PUT | `/settings` | Body is a flat `{ key: value, ... }` map; upserts each key |
| GET | `/settings/logs` | Paginated audit log (`?page&limit&action&userId&success`) |

---

## WebSocket (Socket.IO)

Connect to the backend root (`ws(s)://your-domain.com`) with auth:

```js
io(WS_URL, { auth: { token: accessToken } })
```

Events:
- `online_users` — broadcast on every connect/disconnect: `{ count, users: [...] }`
- `subscribe_analytics` (emit, admin only) — joins the `analytics` room
- `analytics_update` (listen) — pushed every 30s to subscribed admins: `{ totalUsers, totalLicenses, activeLicenses, onlineUsers, timestamp }`

---

## Error Codes

| Status | Meaning |
|---|---|
| 400 | Validation error / bad request |
| 401 | Missing, invalid, or expired token |
| 403 | Authenticated but insufficient role |
| 404 | Resource or route not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
