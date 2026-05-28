#!/usr/bin/env bash
# Install the pg-backup cron on the VPS. Run once as the deploy user.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo install -m 0700 -o deploy -g deploy "$SCRIPT_DIR/pg-backup.sh" /usr/local/bin/pg-backup.sh

# Daily at 03:17 UTC (small offset to spread load across hosts).
CRON_LINE='17 3 * * * ENV_FILE=/srv/golvfabriken/backup/.env /usr/local/bin/pg-backup.sh >> /var/log/pg-backup.log 2>&1'

( crontab -l 2>/dev/null | grep -v pg-backup.sh ; echo "$CRON_LINE" ) | crontab -

sudo touch /var/log/pg-backup.log
sudo chown deploy:deploy /var/log/pg-backup.log

echo "Installed. Verify with: crontab -l"
echo "Test run with: ENV_FILE=/srv/golvfabriken/backup/.env /usr/local/bin/pg-backup.sh"
