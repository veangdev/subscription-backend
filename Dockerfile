# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && \
    yarn cache clean

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

EXPOSE 8080

# Use exec form for proper signal handling
CMD ["node", "--max-old-space-size=1536", "dist/main.js"]
