#!/usr/bin/env bash
# Daily Postgres backup -> Cloudflare R2 (golvfabriken-backups).
# Backs up both prod and staging databases. Encrypts with AES-256 before upload.
# Retention: 7 days (R2 lifecycle handles deletion via bucket policy, but we also
# prune locally and remotely as a belt-and-suspenders measure).
#
# Required env vars (from /srv/golvfabriken/backup/.env):
#   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BACKUP_BUCKET
#   BACKUP_ENCRYPTION_KEY (32+ chars, used for openssl enc -aes-256-cbc)
#   PG_PROD_PASSWORD, PG_STAGING_PASSWORD

set -euo pipefail

ENV_FILE="${ENV_FILE:-/srv/golvfabriken/backup/.env}"
[[ -f "$ENV_FILE" ]] || { echo "missing $ENV_FILE" >&2; exit 1; }
set -a; . "$ENV_FILE"; set +a

WORKDIR="/srv/golvfabriken/backups"
mkdir -p "$WORKDIR"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

log() { echo "[pg-backup] $(date -u +%FT%TZ) $*"; }

dump_one() {
  local env="$1"            # prod | staging
  local container="postgres-$env"
  local pw_var
  if [[ "$env" == "prod" ]]; then pw_var="$PG_PROD_PASSWORD"; else pw_var="$PG_STAGING_PASSWORD"; fi

  for db in medusa_db golvfabriken_cms; do
    local out="$WORKDIR/${env}_${db}_${TS}.sql.gz.enc"
    log "Dumping $env/$db -> $out"
    docker exec -e PGPASSWORD="$pw_var" "$container" \
      pg_dump -U golvfabriken -d "$db" --no-owner --no-privileges --clean --if-exists \
      | gzip -9 \
      | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_KEY -out "$out"

    local size
    size=$(stat -c%s "$out")
    log "Encrypted dump size: $((size/1024)) KiB"

    log "Uploading to R2 -> s3://${R2_BACKUP_BUCKET}/$(basename "$out")"
    docker run --rm \
      -v "$WORKDIR:/data:ro" \
      -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
      -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
      amazon/aws-cli \
      --endpoint-url "$R2_ENDPOINT" \
      s3 cp "/data/$(basename "$out")" "s3://${R2_BACKUP_BUCKET}/$(basename "$out")" \
      --storage-class STANDARD --no-progress
  done
}

prune_local() {
  log "Pruning local dumps older than $RETENTION_DAYS days"
  find "$WORKDIR" -maxdepth 1 -type f -name '*.sql.gz.enc' -mtime "+${RETENTION_DAYS}" -delete
}

prune_remote() {
  log "Pruning R2 objects older than $RETENTION_DAYS days"
  local cutoff
  cutoff=$(date -u -d "${RETENTION_DAYS} days ago" +%Y-%m-%dT%H:%M:%SZ)
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    amazon/aws-cli \
    --endpoint-url "$R2_ENDPOINT" \
    s3api list-objects-v2 --bucket "$R2_BACKUP_BUCKET" --query "Contents[?LastModified<='${cutoff}'].[Key]" --output text \
  | tr '\t' '\n' | grep -v '^$' | while read -r key; do
      log "  deleting $key"
      docker run --rm \
        -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
        -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
        amazon/aws-cli \
        --endpoint-url "$R2_ENDPOINT" \
        s3 rm "s3://${R2_BACKUP_BUCKET}/${key}" --no-progress
    done
}

main() {
  log "Starting backup run $TS"
  if docker ps --format '{{.Names}}' | grep -q '^postgres-prod$';    then dump_one prod;    else log "postgres-prod not running, skipping";    fi
  if docker ps --format '{{.Names}}' | grep -q '^postgres-staging$'; then dump_one staging; else log "postgres-staging not running, skipping"; fi
  prune_local
  prune_remote
  log "Backup run complete"
}

main "$@"
