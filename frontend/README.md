# RetailOps Frontend

Angular frontend for RetailOps, a responsive inventory and sales application.

- Live demo: [https://www.mobags.store/](https://www.mobags.store/)
- API documentation: [https://www.mobags.store/api/docs](https://www.mobags.store/api/docs)
- Repository overview: [../README.md](../README.md)

## Features

- Responsive dashboard, product catalog, checkout, sales, reports, and user management
- English and Arabic localization with RTL layout support
- JWT-authenticated API requests
- Real-time stock updates through Socket.IO
- Product filtering, sorting, and pagination
- Printable invoices
- Keyboard shortcuts and accessible navigation
- Lazy-loaded standalone Angular components

## Technology

- Angular 20 standalone components
- RxJS for client state and asynchronous workflows
- Socket.IO client for inventory updates
- Lucide Angular icons
- Vitest for unit tests
- Playwright for browser and responsive tests

## Run Locally

Install dependencies from the repository root:

```bash
npm install
```

Start only the frontend:

```bash
npm run start:frontend
```

Or run from this directory:

```bash
npm start
```

The development server reads the root `.env` file and runs at
`http://localhost:4200` by default.

API and Socket.IO requests are proxied to the backend configured by:

```env
BACKEND_PROXY_HOST=127.0.0.1
BACKEND_PORT=3000
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=4200
```

When exposing the Angular development server through a domain, allow that hostname and
include its HTTPS origin in the backend CORS configuration:

```env
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=www.mobags.store
CORS_ORIGIN=https://www.mobags.store
```

Restart the frontend after changing `.env`.

## Commands

Run these commands from `frontend/`:

```bash
npm start           # Start Angular development server
npm run build       # Create production build
npm test            # Run unit tests once
npm run test:watch  # Run unit tests in watch mode
npm run test:coverage
npm run test:e2e    # Run Playwright browser tests
```

Equivalent root commands:

```bash
npm run start:frontend
npm run test:frontend
npm run test:frontend:watch
npm run test:frontend:coverage
npm run test:e2e
```

Install the Playwright browser before the first E2E run:

```bash
npx playwright install chromium
```

To test the deployed demo instead of starting a local frontend:

```powershell
$env:E2E_BASE_URL='https://www.mobags.store'; npm run test:e2e
```

## Structure

```text
src/app/
  components/    Routed pages and reusable UI components
  guards/        Authentication and authorization route guards
  interceptors/  JWT HTTP interceptor
  models/        API and application data models
  pipes/         Translation and localized formatting pipes
  services/      API clients, state, i18n, hotkeys, and realtime services
  styles/        Feature-focused shared stylesheets
  types/         Shared TypeScript types
  utils/         Reusable request and calculation helpers
```

Important configuration files:

- `angular.json`: Angular build and development server configuration
- `proxy.conf.cjs`: local API and Socket.IO proxy
- `playwright.config.ts`: browser test configuration
- `vitest.config.ts`: frontend unit-test configuration
- `nginx.conf`: production container routing and API proxy

## Production

The production build is written to:

```text
dist/retail-ops/browser
```

The frontend Docker image serves this build through Nginx and proxies `/api` and
`/socket.io` traffic to the backend service.

