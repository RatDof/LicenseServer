# Database Documentation

See also `database/README.md` for a quick entity overview. This document covers the schema in more depth.

## Technology

- **PostgreSQL 15** (via Docker image `postgres:15-alpine`, or any local install ≥ 13)
- **Prisma ORM** for schema definition, migrations, type-safe queries, and seeding
- Schema source of truth: `backend/prisma/schema.prisma`

## Full Schema Reference

### User
Primary account table. `role` is one of `ADMIN`, `RESELLER`, `USER`. `balance` is a running ledger total kept in sync by `Transaction` records via `UserService.adjustBalance` (wrapped in a Prisma `$transaction` for atomicity). Passwords are hashed with bcrypt (`BCRYPT_ROUNDS`, default 12).

### Product
A sellable software product. `License` records reference exactly one `Product`. Deleting a product is blocked while any licenses reference it.

### License
The core entity. Fields:
- `key` — unique, generated as `XXXXX-XXXXX-XXXXX-XXXXX` (uppercase alphanumeric)
- `status` — `ACTIVE | SUSPENDED | EXPIRED | REVOKED | PENDING`
- `type` — `PERMANENT | TIME_LIMITED | TRIAL`
- `expiresAt` — `null` for `PERMANENT` licenses
- `maxDevices` — device-activation limit enforced at validation time
- `userId` — nullable; a license can be generated unassigned (e.g. via bulk generation) and later sold/assigned

### LicenseDevice
Tracks each device that has activated a license (`deviceId`, `ip`, `lastSeenAt`). Enforced unique on `(licenseId, deviceId)`. New device activation is rejected once `devices.length >= license.maxDevices`.

### Transaction
Immutable ledger entry: `balanceBefore` / `balanceAfter` snapshot the user's balance at the time of the transaction, providing a fully auditable trail independent of the live `User.balance` value. `type` is one of `TOPUP, DEDUCT, TRANSFER_IN, TRANSFER_OUT, LICENSE_PURCHASE, REFUND`.

### Log
Audit trail for every sensitive action across the platform (`LogAction` enum covers login/logout, all CRUD on licenses/users/products, settings changes, balance changes, token refreshes, and failed-login attempts). Includes `ip`, `userAgent`, a free-form `details` JSON blob, and a `success` boolean.

### RefreshToken / Session
Support JWT rotation (`RefreshToken`) and online-user tracking (`Session`, used by the dashboard's "Online Now" stat and Socket.IO room broadcasts).

### Setting
Simple grouped key-value store (`group`: `general | auth | license | billing | system`) powering the Settings page. Updated via upsert so new keys can be introduced without a migration.

## Common Queries (via Prisma Client)

```ts
// Get all active licenses for a user, with product info
await prisma.license.findMany({
  where: { userId, status: 'ACTIVE' },
  include: { product: true, devices: true },
});

// Atomic balance adjustment + ledger entry
await prisma.$transaction([
  prisma.user.update({ where: { id: userId }, data: { balance: newBalance } }),
  prisma.transaction.create({ data: { userId, type: 'TOPUP', amount, balanceBefore, balanceAfter: newBalance, reference } }),
]);
```

## Migration Workflow

```bash
# After editing schema.prisma:
npx prisma migrate dev --name describe_your_change   # dev: creates + applies migration, regenerates client
npx prisma migrate deploy                              # prod: applies pending migrations only, non-interactive
npx prisma studio                                       # visual data browser at http://localhost:5555
```

Migration files are written to `backend/prisma/migrations/` and **must be committed to version control** — they are the only way schema changes propagate to other environments.

## Re-seeding

`npm run prisma:seed` is idempotent for the admin/reseller/sample users (uses `upsert`), but license/transaction/log sample records use `create` and will duplicate on repeated runs. For a clean slate:

```bash
npx prisma migrate reset   # drops the DB, re-applies all migrations, then runs the seed script automatically
```
