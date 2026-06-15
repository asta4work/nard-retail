# RetailOps

A full-stack inventory and sales operations system for retail employees and managers.


## Live Demo

- Explaining Video: [watch at youtube](https://www.youtube.com/watch?v=aTKkAnmj5c0)
- Application: [https://www.mobags.store/](https://www.mobags.store/)
- Swagger API documentation: [https://www.mobags.store/api/docs](https://www.mobags.store/api/docs)
- Focused guides: [Frontend](frontend/README.md) | [Backend](backend/README.md)

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

- [`backend`](backend/README.md): NestJS, TypeORM, MySQL, Redis, Passport JWT, Socket.IO
- [`frontend`](frontend/README.md): Angular standalone components, lazy routes, RxJS services, Vitest, Playwright
- `docker-compose.yml`: MySQL, Redis, backend, and Nginx-served frontend

Checkout is the critical consistency boundary. Product rows are loaded in deterministic order with a `pessimistic_write` lock, stock is validated, sale items are priced from the database, and stock is decremented in one database transaction. WebSocket events are emitted only after commit.

## Run With Docker

```bash
cp .env.example .env
npm run docker:up
```

Open `http://localhost:8080`. The development admin is:

```text
admin@retail.local
ChangeMe123!
```

Change `JWT_SECRET`, database passwords, and the bootstrap admin password before deploying.

Useful Docker commands:

```bash
npm run docker:up        # Build and start frontend, backend, and dependencies
npm run docker:backend   # Build and start backend and its dependencies
npm run docker:frontend  # Build frontend plus backend/Redis dependencies
npm run docker:build     # Build frontend and backend images without starting them
npm run docker:rebuild   # Rebuild and recreate frontend and backend
npm run docker:restart   # Restart existing frontend and backend containers
npm run docker:logs      # Follow frontend and backend logs
npm run docker:ps        # Show Compose service status
npm run docker:stop      # Stop frontend and backend, leaving Redis/MySQL available
npm run docker:down      # Stop and remove the Compose stack
```

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
npm start
```

`npm start` uses `concurrently` to run Nest and Angular together with labeled output in
one terminal, and stops both when either process exits. Use `npm run start:backend` and
`npm run start:frontend` when separate terminals are preferable. Only Redis runs in
Docker; Nest and Angular run directly in watch mode. Stop Redis later with
`npm run redis:stop`.

The same `npm start` command works inside a Node.js demo container. Install all workspace
dependencies, expose `BACKEND_PORT` and `FRONTEND_PORT`, mount or provide the root `.env`,
and ensure MySQL plus Redis are reachable from that container. Both servers bind to
`0.0.0.0` by default.

By default, the backend runs at `http://localhost:3000/api`; Angular runs at
`http://localhost:4200`. The Angular development server reads the root `.env` and
proxies API and WebSocket traffic to the configured backend port.
For a backend running outside Docker, set `DB_HOST=localhost` or the hostname of your
external MySQL server.
For an existing or large external database, set `DB_SYNCHRONIZE=false`; schema
synchronization blocks backend startup and therefore prevents API and Socket.IO traffic
until it completes.

## Environment Configuration

The root `.env` controls local development and Docker Compose:

| Variable | Default | Purpose |
|---|---:|---|
| `BACKEND_HOST` | `0.0.0.0` | Address Nest listens on |
| `BACKEND_PORT` | `3000` | Nest port and frontend proxy target |
| `BACKEND_PROXY_HOST` | `127.0.0.1` | Host Angular uses to reach local Nest |
| `FRONTEND_HOST` | `0.0.0.0` | Address Angular dev server listens on |
| `FRONTEND_PORT` | `4200` | Angular dev server and Playwright port |
| `DOCKER_FRONTEND_PORT` | `8080` | Host port for the Docker Nginx frontend |
| `DOCKER_CORS_ORIGIN` | `http://localhost:8080` | Allowed frontend origin for Docker |
| `CORS_ORIGIN` | `http://localhost:4200` | Allowed local origins, comma-separated |
| `DB_HOST` / `DB_PORT` | `mysql` / `3306` | MySQL connection |
| `REDIS_URL` / `REDIS_PORT` | `redis://localhost:6379` / `6379` | Redis connection and Docker host port |
| `SWAGGER_ENABLED` | `true` | Enable or disable Swagger |
| `SWAGGER_PATH` | `docs` | Swagger path under `/api` |

When changing `FRONTEND_PORT`, also update `CORS_ORIGIN`. Multiple origins are supported:

```env
FRONTEND_PORT=4300
CORS_ORIGIN=http://localhost:4300,http://127.0.0.1:4300
```

When changing `DOCKER_FRONTEND_PORT`, also update `DOCKER_CORS_ORIGIN`.

## Testing

Run all backend and frontend unit tests once:

```bash
npm test
```

Run each unit-test suite separately:

```bash
npm run test:backend
npm run test:frontend
```

Keep tests running while editing:

```bash
npm run test:backend:watch
npm run test:frontend:watch
```

Run one test file by passing part of its filename:

```bash
npm run test:backend -- products.service.spec.ts
npm run test:frontend -- cart.service.spec.ts
```

Generate coverage summaries in the console and HTML reports under `coverage/`:

```bash
npm run test:backend:coverage
npm run test:frontend:coverage
npm run test:coverage
```

The console prints `PASS` or a green check for successful files, failed assertion details
with file and line numbers, the number of passed/failed tests, and coverage percentages.
Watch mode reruns affected tests after every saved change; press `q` to exit it.

Coverage focuses on business logic that unit tests can exercise reliably. Backend
coverage measures services, authorization, exception handling, and realtime event
behavior. Frontend unit coverage measures API/state services and reusable request and
calculation utilities; responsive components, routing, hotkeys, localization, and
Socket.IO browser behavior are verified through Playwright and integration testing.

Install Playwright's browser once, then run browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

Other useful commands:

```bash
npm run build
npm run init-db
npm run perf
```

## Swagger API Documentation

Start the backend and open:

```text
http://localhost:3000/api/docs
```

The host, port, and final `docs` segment follow `BACKEND_PORT` and `SWAGGER_PATH`.
For Docker, open `http://localhost:8080/api/docs` using the configured
`DOCKER_FRONTEND_PORT`.

To call protected endpoints in Swagger:

1. Use `POST /api/auth/login`.
2. Copy the returned `accessToken`.
3. Select **Authorize** and enter the token.

Set `SWAGGER_ENABLED=false` to disable the documentation endpoint.

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
