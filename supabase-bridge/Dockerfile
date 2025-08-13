# syntax=docker/dockerfile:1

# ---------- Builder ----------
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies (including dev deps) based on lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy TS config and sources, then build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runner ----------
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy compiled app from builder
COPY --from=builder /app/dist ./dist

# Port and health
ENV PORT=8000
EXPOSE 8000

# Use non-root user provided by the base image
USER node

CMD ["node", "dist/index.js"]
