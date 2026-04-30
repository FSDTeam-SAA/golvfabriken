# Golvfabriken Local Development

## Prerequisites

- Node.js 20 LTS is the target runtime for this project. This machine currently reports Node `v25.9.0`, so install or switch to Node 20 before relying on long-running development servers.
- npm 11 is currently used by the generated Medusa monorepo.
- Docker Desktop.

## Local Services

Start Postgres and Redis:

```bash
npm run start:infra
```

Stop them:

```bash
npm run stop:infra
```

Local Postgres connection:

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `password`
- Medusa database: `medusa_db`
- Strapi database: `golvfabriken_cms`

Redis runs at `redis://localhost:6379`.

## Medusa Backend

Backend path:

```bash
cd golvfabriken-backend/apps/backend
```

The local backend env file is `golvfabriken-backend/apps/backend/.env`. It is intentionally ignored by git. The key connection values are:

```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/medusa_db
REDIS_URL=redis://localhost:6379
```

Run migrations:

```bash
npx medusa db:migrate
```

Start the backend:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:9001/health
```

Admin dashboard:

- URL: `http://localhost:9001/app`
- Email: `admin@golvfabriken.se`
- Password: `Admin1234!`

This machine currently has PhpStorm listening on port `9000`, so the local backend env uses port `9001`.

## Storefront

Storefront path:

```bash
cd golvfabriken-backend/apps/storefront
```

Start the storefront:

```bash
npm run dev
```

The storefront runs at `http://localhost:8000`.

## CMS

Strapi lives at `golvfabriken-cms`. It uses the same local Postgres container with a separate `golvfabriken_cms` database.

Start the CMS:

```bash
cd golvfabriken-cms
npm run develop
```

The admin panel runs at `http://localhost:1337/admin`. Create the first Strapi admin user there, then generate a full-access API token and paste it into `golvfabriken-backend/apps/backend/.env` as `STRAPI_API_TOKEN`.
