# Deployment Runbook — GreenVolt Solar Service Manager

## Architecture Overview

```
Internet → Caddy (80/443, auto-HTTPS) → dashboard (Caddy static, port 80)
                                       ↘ /api/*     → api (Node, port 3000)
                                         /uploads/* → api (Node, port 3000)
                                                          ↓
                                                    PostgreSQL (port 5432, internal only)
```

All four services run as Docker containers orchestrated by `docker-compose.yml`.

---

## Recommended Hosting

| Option | Cost | Ease | Best for |
|---|---|---|---|
| **Railway** | ~$10–20/mo | Easiest | Solo devs, fast deploys |
| **Render** | ~$15–25/mo | Easy | Slightly more control |
| **DigitalOcean Droplet** | ~$12/mo | Manual | Full control, cheapest |

For a new deployment, **Railway** is recommended. For this runbook we document the **VPS (Docker Compose)** path which works on any cloud VM.

---

## Prerequisites

- A Linux VPS (Ubuntu 22.04+ recommended, 1 vCPU / 1 GB RAM minimum)
- A domain name pointed at the VPS IP (`A` record for `admin.greenvolt.in`)
- Docker + Docker Compose installed on the VPS:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER && newgrp docker
  ```
- `pg_dump` installed locally for backups (from `postgresql-client`)

---

## First Deployment

### 1. Clone the repo on the VPS

```bash
git clone https://github.com/your-org/solar-service-manager.git /opt/solar
cd /opt/solar
```

### 2. Create `.env`

```bash
cp .env.example .env
nano .env
```

Required variables for production:

```env
# Database — used by the api container
DATABASE_URL=postgresql://solar:<PASSWORD>@postgres:5432/solar_service_manager
POSTGRES_USER=solar
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=solar_service_manager

# API
PORT=3000
NODE_ENV=production
JWT_SECRET=<openssl rand -hex 32>
SESSION_SECRET=<openssl rand -hex 32>

# CORS
ALLOWED_ORIGINS=https://admin.greenvolt.in

# Caddy
DOMAIN=admin.greenvolt.in

# Twilio SMS (optional — leave commented out to use mock/log-only mode)
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_FROM_NUMBER=+1234567890

# Sentry (optional — leave blank to disable)
SENTRY_DSN=
VITE_SENTRY_DSN=
```

### 3. Run database migrations

```bash
docker compose up postgres -d
sleep 5
DATABASE_URL=postgresql://solar:<PASSWORD>@localhost:5432/solar_service_manager \
  pnpm --filter @workspace/db run db:push
```

### 4. Seed the first admin user

```bash
DATABASE_URL=postgresql://solar:<PASSWORD>@localhost:5432/solar_service_manager \
ADMIN_EMAIL=admin@greenvolt.in \
ADMIN_PASSWORD=<strong-password> \
ADMIN_NAME=Admin \
  pnpm --filter @workspace/db run seed-admin
```

### 5. Build and start all services

```bash
docker compose up -d --build
```

Caddy will automatically obtain a TLS certificate from Let's Encrypt. Check logs:

```bash
docker compose logs -f caddy
```

### 6. Verify

```bash
curl https://admin.greenvolt.in/api/healthz
# → {"status":"ok"}
```

---

## Routine Deployment (Code Updates)

```bash
cd /opt/solar
git pull
docker compose up -d --build api dashboard
# Zero-downtime: old containers serve traffic while new ones build
```

If the OpenAPI spec changed (schema/routes added):

```bash
# Run migrations before restarting the API
DATABASE_URL=$(grep DATABASE_URL .env | cut -d= -f2-) \
  pnpm --filter @workspace/db run db:push
docker compose restart api
```

---

## Database Migrations

Migrations are managed with Drizzle Kit's `push` command (schema-first, no migration files):

```bash
# From the VPS, with postgres running:
DATABASE_URL=postgresql://solar:<PASSWORD>@localhost:5432/solar_service_manager \
  pnpm --filter @workspace/db run db:push
```

**Always run migrations before deploying a new API version that changes the schema.**

---

## Rollback

### Roll back to a previous Docker image

```bash
# List recent images
docker images solar_api
# Tag a previous image
docker tag <IMAGE_ID> solar_api:rollback
# Update compose to use it (temporarily edit docker-compose.yml image:) and restart
docker compose up -d api
```

### Roll back a bad migration

Drizzle does not auto-generate rollback SQL. Steps:

1. Identify the column/table added in the bad migration
2. Write manual `ALTER TABLE … DROP COLUMN` or `DROP TABLE` SQL
3. Connect and execute: `psql $DATABASE_URL -c "ALTER TABLE …"`
4. Deploy the reverted API code

---

## Database Backups

### Manual backup

```bash
DATABASE_URL=postgresql://solar:<PASSWORD>@localhost:5432/solar_service_manager \
  pnpm run backup:db
# Backup written to: ./backups/solar_db_YYYYMMDD_HHMMSS.sql.gz
```

### Automated daily backup (cron)

Add to crontab (`crontab -e`) on the VPS:

```cron
0 2 * * * cd /opt/solar && DATABASE_URL=postgresql://solar:<PASSWORD>@localhost:5432/solar_service_manager bash scripts/backup-db.sh >> /var/log/solar-backup.log 2>&1
```

Backups are retained for 30 days by default (`KEEP_DAYS` env var).

### Restore from backup

```bash
gunzip -c backups/solar_db_20260101_020000.sql.gz | psql $DATABASE_URL
```

---

## Monitoring & Logs

```bash
# Live logs for all services
docker compose logs -f

# API logs only
docker compose logs -f api

# Check service health
docker compose ps
curl https://admin.greenvolt.in/api/healthz
```

### Sentry

Set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) in `.env` to enable automatic error reporting. Both require a free Sentry account at sentry.io.

For source map uploads from CI, also set:
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

---

## Uploaded Files

Service photos are stored in the `uploads_data` Docker volume, mapped to `/app/uploads` inside the API container. To back up uploads:

```bash
docker run --rm \
  -v solar_uploads_data:/uploads \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /uploads .
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Full PostgreSQL connection string |
| `POSTGRES_USER` | Yes | Postgres user (for postgres container) |
| `POSTGRES_PASSWORD` | Yes | Postgres password |
| `POSTGRES_DB` | Yes | Database name |
| `PORT` | Yes | API server port (3000) |
| `JWT_SECRET` | Yes | Secret for signing JWTs (≥32 chars) |
| `SESSION_SECRET` | Yes | Cookie session secret |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `DOMAIN` | Yes | Public domain for Caddy HTTPS |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID (SMS) |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_FROM_NUMBER` | No | Twilio sender phone number |
| `SENTRY_DSN` | No | Sentry DSN for API error reporting |
| `VITE_SENTRY_DSN` | No | Sentry DSN for dashboard error reporting |
| `SENTRY_AUTH_TOKEN` | No | Sentry token for source map upload |
| `SENTRY_ORG` | No | Sentry organisation slug |
| `SENTRY_PROJECT` | No | Sentry project slug |
| `ADMIN_EMAIL` | Seed only | First admin email |
| `ADMIN_PASSWORD` | Seed only | First admin password |
| `ADMIN_NAME` | Seed only | First admin display name |

---

## Checklist: Go-Live

- [ ] VPS provisioned and SSH access confirmed
- [ ] Domain A record pointing to VPS IP
- [ ] `.env` file created with all required variables
- [ ] `docker compose up postgres -d` and migrations run
- [ ] Admin user seeded
- [ ] `docker compose up -d --build` completed
- [ ] `curl https://<domain>/api/healthz` returns `{"status":"ok"}`
- [ ] Login to admin dashboard works
- [ ] Daily backup cron job configured
- [ ] Sentry DSN set and test error visible in Sentry dashboard
