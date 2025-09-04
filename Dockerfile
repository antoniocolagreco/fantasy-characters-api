# Multi-stage production Dockerfile for Fantasy Characters API
# Stage 1: Base image with pnpm enabled
FROM node:24-alpine AS base
RUN corepack enable pnpm
# Install OpenSSL and wget for Prisma compatibility and health checks
RUN apk add --no-cache openssl wget
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3: Build stage with all dependencies
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build configuration
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build TypeScript to JavaScript
RUN pnpm build

# Prune to production dependencies only
RUN pnpm prune --prod

# Stage 4: Production runtime
FROM base AS runtime

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Copy built application with proper ownership
COPY --from=build --chown=apiuser:nodejs /app/dist ./dist
COPY --from=build --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=apiuser:nodejs /app/package.json ./package.json
COPY --from=build --chown=apiuser:nodejs /app/prisma ./prisma

# Switch to non-root user
USER apiuser

# Expose application port
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD sh -c 'wget --no-verbose --tries=1 --spider http://localhost:3000/api/health && wget --no-verbose --tries=1 --spider http://localhost:3000/api/ready' || exit 1

# Start the application
CMD ["node", "dist/server.js"]
