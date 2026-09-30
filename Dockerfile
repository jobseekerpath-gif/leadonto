# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy all files
COPY . .

# Install dependencies for api-server, lib, AND edubharat (web app)
RUN pnpm install --frozen-lockfile --filter="./artifacts/api-server" --filter="./artifacts/edubharat" --filter="./lib/**"

# Build api-server
RUN pnpm --filter "./artifacts/api-server" run build

# Build React web app
RUN pnpm --filter "./artifacts/edubharat" run build

# Runtime stage
FROM node:20-slim

WORKDIR /app

# Copy built API bundle
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
# Copy built React app — Express serves this at /
COPY --from=builder /app/artifacts/edubharat/dist/public ./artifacts/api-server/dist/public
# Copy dependency trees
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 3000

# Health check hits the real health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/healthz', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]

