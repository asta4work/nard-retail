# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --workspace backend --include-workspace-root --prefer-offline --no-audit --no-fund
COPY backend backend
RUN npm run build -w backend && \
    npm prune --omit=dev --workspace backend --include-workspace-root --no-audit --no-fund

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/backend/dist backend/dist
EXPOSE 3000
CMD ["node", "backend/dist/main.js"]
