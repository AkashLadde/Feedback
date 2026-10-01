# Multi-stage Dockerfile for LabGuard Enterprise Deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install && npm install --prefix server && npm install --prefix client

# Copy application sources
COPY server/ ./server/
COPY client/ ./client/

# Build client React application and server TypeScript
RUN npm run build --prefix client
RUN npm run build --prefix server

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Expose HTTP port
EXPOSE 5000

# Start server
CMD ["node", "server/dist/server.js"]
