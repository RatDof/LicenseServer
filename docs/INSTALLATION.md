# Installation Guide — Clean Windows PC

This guide walks through every step needed to run LicenseServer from a completely clean Windows machine, with **no prior tools installed**.

## 1. Install Node.js

1. Download the LTS installer from https://nodejs.org (v20.x recommended).
2. Run the installer, accept defaults, ensure "Add to PATH" is checked.
3. Verify in a new PowerShell/CMD window:
   ```powershell
   node -v
   npm -v
   ```

## 2. Install PostgreSQL (skip if using Docker)

1. Download from https://www.postgresql.org/download/windows/
2. During setup, set a password for the `postgres` superuser (remember it).
3. Keep the default port `5432`.
4. After install, open **pgAdmin** or `psql` and create the database:
   ```sql
   CREATE DATABASE licenseserver;
   ```

## 3. Install Docker Desktop (recommended — alternative to step 2)

1. Download from https://www.docker.com/products/docker-desktop/
2. Install and restart your PC if prompted.
3. Launch Docker Desktop and wait until it shows "Engine running".
4. Verify:
   ```powershell
   docker -v
   docker compose version
   ```

> You only need **either** a local PostgreSQL install (step 2) **or** Docker (step 3) — Docker is simpler since it also runs the whole stack for you (see "Quick Start with Docker" below).

## 4. Install Android Studio (only needed for the Android example app)

1. Download from https://developer.android.com/studio
2. Run the installer, accept the default SDK components.
3. Open Android Studio at least once and let it finish the SDK Manager setup wizard.

## 5. Clone / Extract the Project

```powershell
cd C:\Projects
git clone <your-repo-url> LicenseServer
cd LicenseServer
```
(If you received this as a zip, just extract it instead of cloning.)

---

## Quick Start with Docker (simplest path)

```powershell
cd LicenseServer\docker
copy .env.example .env
docker compose up -d --build
```

This builds and starts PostgreSQL, the backend API, the Next.js frontend, and Nginx all at once.

Then run migrations + seed (one time only):

```powershell
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Open **http://localhost** (via Nginx) or **http://localhost:3000** (frontend directly).

Login with `admin@licenseserver.com` / `Admin@123456`.

---

## Manual Setup (without Docker)

### A. Backend

```powershell
cd LicenseServer\backend
copy .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your local PostgreSQL credentials, e.g.:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/licenseserver?schema=public"
```

Install dependencies and set up the database:

```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

Start the backend:

```powershell
npm run dev
```

The API is now live at `http://localhost:4000`. Verify with: `http://localhost:4000/api/v1/health`

### B. Frontend

Open a **new** terminal window:

```powershell
cd LicenseServer\frontend
copy .env.example .env.local
npm install
npm run dev
```

The admin panel is now live at `http://localhost:3000`. Default login: `admin@licenseserver.com` / `Admin@123456`.

> If you didn't create `frontend/.env.example`, just create `frontend/.env.local` manually with:
> ```
> NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
> NEXT_PUBLIC_WS_URL=http://localhost:4000
> ```

### C. Production Build (optional)

```powershell
cd LicenseServer\backend
npm run build
npm start

cd ..\frontend
npm run build
npm start
```

---

## Build the Android Example App

```powershell
cd LicenseServer\android-example
```

Open this folder in **Android Studio** → wait for Gradle sync → click **Run ▶** (with an emulator or USB-debugging device connected).

Or via command line (after generating the Gradle wrapper once with `gradle wrapper`, requires a local Gradle install):

```powershell
gradlew.bat assembleDebug
```

The emulator reaches your backend via `http://10.0.2.2:4000/api/v1/` automatically (already configured in `app/build.gradle.kts`). For a physical device, edit that URL to your PC's LAN IP address.

---

## Troubleshooting

- **`prisma generate` fails with a network error**: Prisma downloads query-engine binaries from `binaries.prisma.sh` on first run — make sure your firewall/antivirus isn't blocking outbound HTTPS, then retry.
- **`EADDRINUSE` on port 4000 or 3000**: another process is using the port. Change `PORT` in `backend/.env` or stop the conflicting process.
- **Frontend shows network errors**: confirm the backend is running and `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to the correct backend URL.
- **Database connection refused**: confirm PostgreSQL service is running (`services.msc` → "postgresql-x64-15") or that the Docker `postgres` container is healthy (`docker compose ps`).
