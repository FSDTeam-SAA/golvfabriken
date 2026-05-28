#!/bin/sh
# Postgres init: create the Strapi database alongside the default Medusa DB.
# Runs only on first boot of a fresh data volume.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE golvfabriken_cms;
EOSQL
