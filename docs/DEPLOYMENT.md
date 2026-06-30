# Deployment Guide

## Production Checklist

Before deploying to a real server, change the following:

1. **Secrets** — generate strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ characters each). Never reuse the example values.
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. **Database password** — set a strong `POSTGRES_PASSWORD` and update `DATABASE_URL` accordingly.
3. **CORS_ORIGINS** — restrict to your real frontend domain(s) only, comma-separated, no trailing slash.
4. **Admin password** — log in once with the seeded admin account, then immediately change the password from the Profile page (or re-seed with a custom `ADMIN_PASSWORD` env before first seed).
5. **HTTPS** — terminate TLS at Nginx (or your load balancer/CDN) in production; never expose port 4000 or 3000 directly to the internet.

## Recommended Topology

```
Internet → Nginx (80/443, TLS) → ┬─ / → Next.js frontend (3000)
                                   └─ /api, /socket.io → Express backend (4000)
                                                            └─ PostgreSQL (5432, internal only)
```

This is exactly what `docker/docker-compose.yml` + `nginx/nginx.conf` implement.

## Deploying with Docker Compose (VPS / dedicated server)

```bash
git clone <repo> /opt/licenseserver
cd /opt/licenseserver/docker
cp .env.example .env
nano .env   # set real secrets, domain, CORS origins

docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed   # first run only
```

### Adding HTTPS (Let's Encrypt via Certbot)

Run certbot against the Nginx container (or use a reverse proxy like Traefik/Caddy in front of this stack). Example using a standalone certbot container:

```bash
docker run -it --rm \
  -v /opt/licenseserver/certs:/etc/letsencrypt \
  -p 80:80 certbot/certbot certonly --standalone -d your-domain.com
```

Then update `nginx/nginx.conf` to add a `listen 443 ssl;` server block referencing the issued certificate, and reload Nginx (`docker compose restart nginx`).

## Deploying Backend + Frontend Separately (PaaS-style)

### Backend (any Node.js host: Railway, Render, Fly.io, a VPS, etc.)

```bash
cd backend
npm install
npm run build
npx prisma migrate deploy
npm start
```
Set all variables from `.env.example` in your host's environment-variable dashboard. Ensure the platform allows persistent outbound TCP to your PostgreSQL instance.

### Frontend (Vercel, Netlify, or any Node host)

```bash
cd frontend
npm install
npm run build
npm start
```
Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your deployed backend's public URL at build time (these are baked into the client bundle).

## Database Backups

```bash
# Backup
docker compose exec postgres pg_dump -U licenseserver licenseserver > backup_$(date +%F).sql

# Restore
cat backup_2026-06-30.sql | docker compose exec -T postgres psql -U licenseserver licenseserver
```

Schedule this with cron for nightly backups in production.

## Zero-Downtime Migrations

`prisma migrate deploy` (used in the backend Docker entrypoint and in CI) only applies pending migrations and never prompts interactively — safe for automated deploys. Always run `prisma migrate dev` locally first to generate the migration files, commit them, then let `migrate deploy` apply them in production.

## Monitoring

- `GET /api/v1/health` — lightweight liveness check, suitable for load balancer health checks.
- Application logs are written to stdout via Winston — pipe them to your log aggregator of choice (`docker compose logs -f backend`).
- The `Log` table in PostgreSQL retains a full audit trail (logins, license operations, admin actions) viewable from **Settings → Activity Logs** in the admin panel.

## Scaling Notes

- The backend is stateless except for Socket.IO connections — when running multiple backend replicas, attach a Redis adapter for Socket.IO (`@socket.io/redis-adapter`) so `online_users`/`analytics_update` events broadcast correctly across instances.
- PostgreSQL connection pooling: for serverless/high-concurrency deployments, place PgBouncer (or Prisma Accelerate) in front of PostgreSQL and point `DATABASE_URL` at the pooler.
