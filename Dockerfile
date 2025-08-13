# Multi-stage Dockerfile for production
FROM node:24-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9.14.2

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage
FROM base AS build

# Build the application
RUN pnpm run build

# Production stage
FROM node:24-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm@9.14.2

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist

# Copy any other necessary files
COPY --chown=nextjs:nodejs .env.example .env

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/api/health', timeout: 2000 }; const request = http.request(options, (res) => { console.log('STATUS:', res.statusCode); process.exitCode = (res.statusCode === 200) ? 0 : 1; }); request.on('error', function(err) { console.log('ERROR'); process.exitCode = 1; }); request.end();"

# Start command
CMD ["node", "dist/index.js"]
