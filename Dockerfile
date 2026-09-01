# Multi-stage Dockerfile optimized for Northflank, Railway, Render, Fly.io
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies and build frontend & backend
RUN npm install
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

# Copy compiled build output from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
