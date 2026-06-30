# Database — LicenseServer

LicenseServer uses **PostgreSQL 15+** as its primary datastore, managed entirely through **Prisma ORM**. The canonical schema lives at `backend/prisma/schema.prisma` (a copy is mirrored here under `prisma-reference/` for documentation purposes — always edit the one in `backend/prisma/`).

## Entity Overview

| Model | Description |
|---|---|
| `User` | Accounts (Admin / Reseller / User), holds balance, auth credentials |
| `Product` | Sellable software products that licenses are issued for |
| `License` | A license key bound to a product, optionally a user, with status/type/expiry |
| `LicenseDevice` | Devices activated against a license (device-limit enforcement) |
| `Transaction` | Balance ledger entries (top-up, deduct, transfer, purchase, refund) |
| `Log` | Full audit trail of all sensitive actions (login, license ops, admin ops) |
| `RefreshToken` | Persisted refresh tokens for JWT rotation |
| `Session` | Active login sessions (used for online-user tracking) |
| `Setting` | Key-value platform configuration, grouped by category |

## Relations & Foreign Keys

- `License.userId → User.id` (SetNull on delete — license survives user deletion, becomes unassigned)
- `License.productId → Product.id` (required)
- `LicenseDevice.licenseId → License.id` (Cascade — devices removed with license)
- `Transaction.userId → User.id`, `Transaction.senderId → User.id` (for transfers)
- `Log.userId → User.id` (SetNull — logs persist even if user is deleted)
- `RefreshToken.userId → User.id` (Cascade)
- `Session.userId → User.id` (Cascade)

## Indexes

Indexes are defined on all foreign keys plus frequently filtered/sorted columns: `User.email`, `User.username`, `User.role`, `User.isActive`, `License.key`, `License.status`, `License.type`, `License.expiresAt`, `Transaction.type`, `Transaction.createdAt`, `Log.action`, `Log.createdAt`, `Log.success`, and more — see `schema.prisma` for the full list.

## Migrations

Migrations are generated and applied via Prisma CLI from the `backend/` folder:

```bash
cd backend
npx prisma migrate dev --name init      # development: create + apply a new migration
npx prisma migrate deploy               # production: apply pending migrations only
npx prisma studio                       # visual database browser
```

## Seeding

`backend/prisma/seed.ts` populates:
- 1 admin user (`admin@licenseserver.com` / `Admin@123456`)
- 1 reseller user
- 5 regular users with randomized balances
- 4 products (Basic, Pro, Enterprise, Lifetime)
- 20 sample licenses across all statuses/types
- 10 sample transactions
- 15 sample audit logs
- 12 default platform settings

Run with:

```bash
npm run prisma:seed
```

## Manual SQL Init

`init.sql` in this folder enables the `uuid-ossp` and `pgcrypto` PostgreSQL extensions and sets the session timezone to UTC. It is automatically executed by the Postgres Docker container on first boot (mounted into `/docker-entrypoint-initdb.d/`). Actual tables are created exclusively through Prisma migrations — never edit the database schema by hand.
