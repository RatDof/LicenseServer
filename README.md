# LicenseServer

A complete, production-ready, self-hosted **authentication and license management platform** — backend API, admin web panel, PostgreSQL database, Android client, and full Docker deployment, all included.

![Status](https://img.shields.io/badge/status-production--ready-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🔐 JWT auth with refresh-token rotation, bcrypt password hashing, rate limiting
- 🔑 Full license lifecycle — create, bulk-generate, suspend, resume, expire, permanent or time-limited, per-device activation limits
- 💰 Balance/wallet system with full transaction ledger (top-ups, deductions, transfers, purchases, refunds)
- 📊 Real-time admin dashboard — live online-user count, animated stat cards, revenue/license/user-growth charts via Socket.IO
- 📜 Full audit logging (every login, license op, admin action — with IP, user agent, timestamp)
- 🎨 Glassmorphism / AMOLED dark "liquid glass" UI built with Next.js, TailwindCSS, and Framer Motion
- 📱 Native Android example client (Kotlin, Jetpack Compose, MVVM, Hilt, Retrofit) — login, secure token storage, auto-refresh, license expiry display
- 🐳 One-command Docker Compose deployment with Nginx reverse proxy

## 📁 Project Structure

```
LicenseServer/
├── backend/            Node.js + Express + TypeScript + Prisma REST API
├── frontend/            Next.js + React + TypeScript + TailwindCSS admin panel
├── android-example/      Kotlin + Jetpack Compose example client
├── database/             Prisma schema reference, init SQL, DB documentation
├── nginx/                 Production Nginx reverse-proxy config
├── docker/                Dockerfiles + docker-compose.yml for the full stack
├── docs/                  API, installation, deployment, and database docs
└── README.md              You are here
```

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Socket.IO, Helmet, CORS |
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion, Recharts |
| Database | PostgreSQL 15 |
| Android | Kotlin, Jetpack Compose, MVVM, Hilt, Retrofit, Coroutines, StateFlow |
| Infra | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start (Windows, from a clean PC)

For complete copy-paste-able step-by-step instructions (including installing Node.js, Docker, PostgreSQL, and Android Studio from scratch), see **[docs/INSTALLATION.md](docs/INSTALLATION.md)**.

### Fastest path — Docker Compose

```powershell
cd LicenseServer\docker
copy .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Open **http://localhost** → log in with `admin@licenseserver.com` / `Admin@123456`.

### Manual path

```powershell
# 1) Backend
cd LicenseServer\backend
copy .env.example .env
REM edit .env -> set DATABASE_URL to your local Postgres
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

```powershell
# 2) Frontend (new terminal)
cd LicenseServer\frontend
copy .env.example .env.local
npm install
npm run dev
```

Visit **http://localhost:3000**.

### Android Example App

```powershell
cd LicenseServer\android-example
```
Open in **Android Studio** → Gradle sync → **Run ▶**. The emulator reaches your local backend automatically via `http://10.0.2.2:4000/api/v1/`.

---

## 🔑 Default Credentials (seeded)

| Role | Identifier | Password |
|---|---|---|
| Admin | `admin@licenseserver.com` | `Admin@123456` |
| Reseller | `reseller@licenseserver.com` | `Reseller@123` |
| User | `user1@licenseserver.com` … `user5@licenseserver.com` | `User1@123` … `User5@123` |

⚠️ **Change these immediately in any real deployment.**

## 📖 Documentation

- [docs/INSTALLATION.md](docs/INSTALLATION.md) — full setup guide from a clean machine
- [docs/API.md](docs/API.md) — every REST endpoint, request/response shapes, WebSocket events
- [docs/DATABASE.md](docs/DATABASE.md) — schema, relations, migrations, seeding
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production deployment, HTTPS, backups, scaling
- [android-example/README.md](android-example/README.md) — Android client architecture and build instructions

## 🧩 Architecture at a Glance

```
                       ┌──────────────────┐
                       │   Nginx (80/443)  │
                       └─────────┬────────┘
                  ┌──────────────┴───────────────┐
        ┌─────────▼─────────┐           ┌─────────▼─────────┐
        │  Next.js Frontend  │           │  Express Backend   │
        │   (Admin Panel)    │◄─────────►│  (REST + Socket.IO)│
        └─────────────────────┘   API    └─────────┬──────────┘
                                                      │ Prisma
                                            ┌─────────▼──────────┐
                                            │   PostgreSQL 15     │
                                            └──────────────────────┘

        ┌───────────────────────┐
        │  Android Example App   │ ───────► same REST API
        │ (Kotlin / Compose)      │
        └───────────────────────┘
```

## 🛡️ Security Notes

- Passwords hashed with bcrypt (cost factor 12 by default)
- Short-lived access tokens (15 min) + rotating refresh tokens (7 days)
- Global + auth-specific rate limiting (`express-rate-limit`)
- Helmet security headers, strict CORS allow-list
- Full audit trail of sensitive actions via the `Log` model
- Role-based access control (`ADMIN`, `RESELLER`, `USER`) enforced at the middleware level on every protected route

## 📄 License

MIT — use freely for personal or commercial projects.
