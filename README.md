# RetailOps

A full-stack inventory and sales operations system for retail employees and managers.

## Features

- Role-based JWT authentication for admins and employees
- Product CRUD with validation, combined server-side filters, sorting, and pagination
- Atomic checkout with pessimistic row locks to prevent overselling
- Invoice details and browser printing after checkout
- Searchable, paginated sales history
- Admin sales and inventory reports with trend and category views
- Real-time stock synchronization through a NestJS Socket.IO gateway
- Responsive bilingual Angular UI with English/Arabic localization and full RTL support
- Global keyboard shortcuts for navigation, product search, quick add, and checkout
- Reusable print-optimized invoice documents
- MySQL constraints, foreign keys, and catalog/reporting indexes

## Architecture

The repository is an npm-workspace monorepo:

- `backend`: NestJS, TypeORM, MySQL, Redis, Passport JWT, Socket.IO
- `frontend`: Angular standalone components, lazy routes, RxJS services, Vitest, Playwright
- `docker-compose.yml`: MySQL, Redis, backend, and Nginx-served frontend

Checkout is the critical consistency boundary. Product rows are loaded in deterministic order with a `pessimistic_write` lock, stock is validated, sale items are priced from the database, and stock is decremented in one database transaction. WebSocket events are emitted only after commit.

## Run With Docker

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:8080`. The development admin is:

```text
admin@retail.local
ChangeMe123!
```

Change `JWT_SECRET`, database passwords, and the bootstrap admin password before deploying.

To connect the backend container to MySQL running elsewhere, set `DB_HOST` in `.env` to
the database hostname or IP address. Set `DB_PORT` as well if MySQL is not listening on
port `3306`, and remove `COMPOSE_PROFILES=local-db` so Compose does not start the bundled
MySQL service. Keep `COMPOSE_PROFILES=local-db` and `DB_HOST=mysql` when using the MySQL
service included in this Compose file. When MySQL runs directly on a Windows or macOS
Docker host, use `DB_HOST=host.docker.internal`.

## Local Development

Prerequisites: Node.js 22+, npm 10+, MySQL 8 or access to an external MySQL server,
and Docker Desktop for Redis.

```bash
npm install
npm run redis:start
npm run start:backend
npm run start:frontend
```

Run `start:backend` and `start:frontend` in separate terminals. Only Redis runs in
Docker; Nest and Angular run directly on Windows in watch mode. Stop Redis later with
`npm run redis:stop`.

The backend runs at `http://localhost:3000/api`; Angular runs at `http://localhost:4200`. The Angular development server proxies API and WebSocket traffic to the backend.
For a backend running outside Docker, set `DB_HOST=localhost` or the hostname of your
external MySQL server.
For an existing or large external database, set `DB_SYNCHRONIZE=false`; schema
synchronization blocks backend startup and therefore prevents API and Socket.IO traffic
until it completes.

Useful commands:

```bash
npm run build
npm test
npm run test:coverage
npm run test:e2e
npm run init-db
```

Install Playwright's browser once before running its smoke tests:

```bash
npx playwright install chromium
```

## Redis Caching

Product lists, individual products, categories, sales history, and reports are cached in
Redis. Product writes and successful checkouts invalidate the affected cache groups.
The backend continues using MySQL directly when Redis is unavailable.

Set `REDIS_URL` and the default cache lifetime in `.env`:

```env
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=60
```

Docker Compose starts Redis automatically and configures the backend to use it.

## Performance Testing

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) and run:

```bash
npm run perf
```

The scenario tests cached catalog and report reads with latency and failure thresholds.
Configure it through `BASE_URL`, `TEST_EMAIL`, `TEST_PASSWORD`, `VUS`, `REPORT_RATE`, and
`DURATION`.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+1` through `Alt+6` | Open dashboard, products, checkout, sales, reports, or users |
| `Alt+F` | Open products and focus search |
| `Alt+A` | Add the first available product to the cart |
| `Alt+S` | Complete the current sale from checkout |
| `?` | Show all keyboard shortcuts |

`npm run init-db` safely merges premade and bulk-generated users, products, and sales into
the configured database. Existing users and products are left unchanged, and generated
sales track their applied count so reruns do not duplicate them. Seeded accounts use
`ChangeMe123!` and should have their passwords changed.

Configure bulk generation in `.env`:

| Variable | Default | Purpose |
|---|---:|---|
| `SEED_LOCALE` | `mixed` | Generate `en`, `ar`, or alternating `mixed` data |
| `SEED_PRODUCT_COUNT` | `1000` | Number of generated products |
| `SEED_USER_COUNT` | `100` | Number of generated users |
| `SEED_SALE_COUNT` | `2500` | Target number of generated sales per locale mode |
| `SEED_BATCH_SIZE` | `250` | Records processed per database batch |

Set any count to `0` to disable that generated data type. Increasing a count later adds
only the missing deterministic records.

For a running Docker deployment:

```bash
docker compose exec backend node backend/dist/database/init-db.js
```

## API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public, creates employee |
| GET/POST/PATCH/DELETE | `/api/products` | Read: authenticated; write: admin |
| POST | `/api/sales` | Authenticated |
| GET | `/api/sales` and `/api/sales/:id` | Authenticated |
| GET | `/api/reports/sales` and `/api/reports/inventory` | Admin |
| GET/POST/PATCH | `/api/users` | Admin |

## Production Notes

- Set `DB_SYNCHRONIZE=false` and manage schema changes through reviewed TypeORM migrations in production.
- Put the backend behind TLS and restrict CORS to the deployed frontend origin.
- Public registration intentionally creates employees only. Disable or replace it with an admin invitation flow where self-registration is not appropriate.
- JWT access tokens are stored in local storage for this implementation. For higher-security deployments, use short-lived access tokens plus rotating refresh tokens in secure, HTTP-only cookies.
- Product name and description search uses a MySQL full-text index with boolean-prefix matching.
