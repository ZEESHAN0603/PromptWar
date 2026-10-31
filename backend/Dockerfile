# Multi-stage Docker build for EventPilot AI Backend
# Production-optimized, secure non-root user

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for compilation)
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Validate and generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript in /dist
RUN npm run build

# ----------------------------------------------------
# Production Runner
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper signal forwarding
RUN apk add --no-cache dumb-init

# Copy package descriptors and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npx prisma generate

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
