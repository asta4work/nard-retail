# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --workspace frontend --include-workspace-root --prefer-offline --no-audit --no-fund
COPY frontend frontend
RUN npm run build -w frontend

FROM nginx:1.27-alpine
ENV BACKEND_PORT=3000
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/frontend/dist/retail-ops/browser /usr/share/nginx/html
EXPOSE 80
