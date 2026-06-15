# RetailOps Backend

NestJS API for RetailOps inventory, checkout, reporting, user management, and real-time
stock synchronization.

- Live demo: [https://www.mobags.store/](https://www.mobags.store/)
- Live Swagger API docs: [https://www.mobags.store/api/docs](https://www.mobags.store/api/docs)
- Repository overview: [../README.md](../README.md)

## Features

- JWT authentication with admin and employee roles
- Product CRUD, filtering, sorting, search, and pagination
- Atomic checkout with pessimistic product-row locking
- Sales history and invoice data
- Admin sales and inventory reports
- Redis-backed caching with database fallback
- Socket.IO stock and product update events
- Swagger/OpenAPI documentation
- Configurable English, Arabic, or mixed demo-data generation

## Technology

- NestJS 11
- TypeORM and MySQL
- Redis
- Passport JWT and bcrypt
- Socket.IO
- Swagger/OpenAPI
- Jest

## Run Locally

Install dependencies from the repository root:

```bash
npm install
```

Make sure MySQL and Redis are available, then start only the backend:

```bash
npm run redis:start
npm run start:backend
```

Or run from this directory:

```bash
npm run start:dev
```

The API runs at `http://localhost:3000/api` by default. Local Swagger documentation is
available at `http://localhost:3000/api/docs`.

## Required Configuration

The backend reads the repository root `.env` file.

```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3000

DB_HOST=localhost
DB_PORT=3306
MYSQL_DATABASE=retail_ops
MYSQL_USER=retail
MYSQL_PASSWORD=retail_password
DB_SYNCHRONIZE=true

REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=60

JWT_SECRET=replace-with-a-long-random-production-secret
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:4200

SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

Use comma-separated values when multiple frontend origins need API access:

```env
CORS_ORIGIN=http://localhost:4200,https://www.mobags.store
```

For an external or production database, set `DB_HOST`, `DB_PORT`, and credentials to
that server and use:

```env
DB_SYNCHRONIZE=false
```

## Commands

Run these commands from `backend/`:

```bash
npm run start:dev   # Start Nest in watch mode
npm run build       # Compile backend to dist/
npm start           # Run compiled dist/main.js
npm test            # Run unit tests once
npm run test:watch  # Run unit tests in watch mode
npm run init-db     # Merge seed and generated demo data
```

Equivalent root commands:

```bash
npm run start:backend
npm run test:backend
npm run test:backend:watch
npm run test:backend:coverage
npm run init-db
```

## API

All HTTP endpoints use the `/api` prefix.

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/register` | Public; creates an employee |
| `GET` | `/api/products` and `/api/products/:id` | Authenticated |
| `POST/PATCH/DELETE` | `/api/products` | Admin |
| `POST` | `/api/sales` | Authenticated |
| `GET` | `/api/sales` and `/api/sales/:id` | Authenticated |
| `GET` | `/api/reports/sales` and `/api/reports/inventory` | Admin |
| `GET/POST/PATCH` | `/api/users` | Admin |

Use Swagger for the complete request schemas and interactive endpoint documentation:

- Production: [https://www.mobags.store/api/docs](https://www.mobags.store/api/docs)
- Local: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

For protected endpoints, call `POST /api/auth/login`, copy `accessToken`, then use
Swagger's **Authorize** button.

## Structure

```text
src/
  auth/       Authentication, JWT strategy, and login/register API
  cache/      Redis cache abstraction and fallback behavior
  common/     Roles, pagination, and global exception handling
  database/   TypeORM configuration and demo-data initializer
  products/   Product entity, API, validation, and business logic
  realtime/   Socket.IO inventory gateway
  reports/    Sales and inventory reporting
  sales/      Checkout transaction, sales entities, and history API
  users/      User entity, API, and administration logic
```

## Database Initialization

`npm run init-db` safely merges deterministic users, products, and sales into the
configured database. Existing records are retained.

```env
SEED_LOCALE=mixed
SEED_PRODUCT_COUNT=1000
SEED_USER_COUNT=100
SEED_SALE_COUNT=2500
SEED_BATCH_SIZE=250
```

`SEED_LOCALE` accepts `en`, `ar`, or `mixed`. Set a count to `0` to skip that data type.

## Realtime And Caching

Successful product changes and checkouts emit Socket.IO events after database writes
complete. The frontend connects through `/socket.io`.

Product, sales, and report reads are cached in Redis. Related cache groups are
invalidated after writes. If Redis is unavailable, the backend continues reading from
MySQL.

## Production Notes

- Set `DB_SYNCHRONIZE=false` and use reviewed migrations.
- Use a strong `JWT_SECRET`.
- Restrict `CORS_ORIGIN` to trusted HTTPS frontend origins.
- Disable Swagger with `SWAGGER_ENABLED=false` if public API documentation is unwanted.
- Run `npm run build` before `npm start`.

