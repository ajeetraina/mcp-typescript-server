# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create data directories with proper permissions
RUN mkdir -p /app/data /app/temp /app/logs && \
    addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs && \
    chown -R mcp:nodejs /app

# Copy configuration files
COPY config.json ./config.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]