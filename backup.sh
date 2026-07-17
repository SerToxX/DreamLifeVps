#!/bin/bash
# backup.sh — corre desde la raíz del repo en el VPS
set -e
DIR="$(dirname "$0")"
FECHA=$(date +%F)
mkdir -p "$DIR/backups"
docker exec dreamlife_mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" dream_life' \
  | gzip > "$DIR/backups/dreamlife_${FECHA}.sql.gz"
find "$DIR/backups" -name "*.sql.gz" -mtime +14 -delete
