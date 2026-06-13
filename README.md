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

- `backend`: NestJS, TypeORM, MySQL, Passport JWT, Socket.IO
- `frontend`: Angular standalone components, lazy routes, RxJS services
- `docker-compose.yml`: MySQL, backend, and Nginx-served frontend

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

Prerequisites: Node.js 22+, npm 10+, and MySQL 8.

```bash
npm install
npm run start:backend
npm run start:frontend
```

The backend runs at `http://localhost:3000/api`; Angular runs at `http://localhost:4200`. The Angular development server proxies API and WebSocket traffic to the backend.
For a backend running outside Docker, set `DB_HOST=localhost` or the hostname of your
external MySQL server.

Useful commands:

```bash
npm run build
npm test
npm run init-db
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+1` through `Alt+6` | Open dashboard, products, checkout, sales, reports, or users |
| `Alt+F` | Open products and focus search |
| `Alt+A` | Add the first available product to the cart |
| `Ctrl+Enter` | Complete the current sale from checkout |
| `?` | Show all keyboard shortcuts |

`npm run init-db` safely merges premade users, products, and demo sales into the configured
database. Existing users and products are left unchanged, and demo sales are inserted only
once. Seeded accounts use `ChangeMe123!` and should have their passwords changed.

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
