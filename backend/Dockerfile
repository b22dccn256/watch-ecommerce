# ==========================================
# STAGE 1: Build & Dependencies Installation
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configuration
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# ==========================================
# STAGE 2: Lightweight Production Execution
# ==========================================
FROM node:20-alpine

# Set environment
ENV NODE_ENV=production
WORKDIR /app

# Copy only production node_modules from Stage 1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy server code
COPY . .

# Expose backend port
EXPOSE 5000

# Set container security user to non-root
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { if (r.statusCode === 200) process.exit(0); else process.exit(1); })" || exit 1

# Start production server
CMD ["node", "server.js"]
