# ---------- Stage 1: Frontend Builder ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend .
RUN npm run build


# ---------- Stage 2: Backend Production ----------
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache wget
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --chown=appuser:appgroup src ./src
COPY --chown=appuser:appgroup create-admin.js ./create-admin.js
COPY --chown=appuser:appgroup env.production.example ./env.production.example
COPY --from=frontend-builder --chown=appuser:appgroup /frontend/dist ./frontend/dist

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

CMD ["node", "src/server.js"]