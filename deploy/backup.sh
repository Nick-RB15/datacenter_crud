#!/bin/bash
set -e
 
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
DB_NAME="${DB_NAME:-datacenter_crud_db}"
KEEP_DAYS="${KEEP_DAYS:-7}"
PGPORT="${PGPORT:-5433}"
 
export PGPORT
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/${DB_NAME}-$(date +%Y%m%d-%H%M%S).sql.gz"
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$FILE"
find "$BACKUP_DIR" -type f -mtime +"$KEEP_DAYS" -delete
 
echo "Backup created: $FILE"