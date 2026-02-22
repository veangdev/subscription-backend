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

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/main.js"]
