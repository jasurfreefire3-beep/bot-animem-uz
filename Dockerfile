# Multi-stage Dockerfile for Fly.io deployment

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
# If bun.lock or package-lock.json exists, copy them too
COPY bun.lock* ./

RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./

EXPOSE 3000
CMD ["npm", "start"]
