#!/usr/bin/env bash
# backup-db.sh — Dumps the PostgreSQL database to a timestamped gzip file.
#
# Usage (local):
#   ./scripts/backup-db.sh
#
# Usage (cron, daily at 02:00):
#   0 2 * * * /path/to/project/scripts/backup-db.sh >> /var/log/solar-backup.log 2>&1
#
# Environment variables (or set directly below):
#   DATABASE_URL  — postgres connection string
#   BACKUP_DIR    — directory to write backups (default: ./backups)
#   KEEP_DAYS     — number of days to retain backups (default: 30)

set -euo pipefail

DB_URL="${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="solar_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup → ${BACKUP_DIR}/${FILENAME}"
pg_dump "$DB_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"
echo "[$(date -Iseconds)] Backup complete: $(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1)"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "solar_db_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date -Iseconds)] Pruned backups older than ${KEEP_DAYS} days"
