# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock ./

# Install ALL dependencies (including dev) for build
RUN yarn install --frozen-lockfile --network-timeout 100000

# Copy source and build
COPY . .
RUN yarn build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Copy dependency files and install production deps ONLY
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --network-timeout 100000 && \
    yarn cache clean && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Healthcheck with extended start period for Cloud Run
HEALTHCHECK --interval=10s --timeout=3s --start-period=120s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

EXPOSE 8080

# Simple direct execution
CMD ["node", "--max-old-space-size=1792", "dist/main.js"]
