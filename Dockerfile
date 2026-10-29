# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install Python and Kokoro system prerequisites
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-venv espeak-ng libsndfile1 && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/kokoro-venv
ENV PATH="/opt/kokoro-venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r tts-service/requirements.txt

# Install pnpm
RUN npm install -g pnpm

# Copy all files
COPY . .

# Install dependencies for api-server, lib, AND edubharat (web app)
RUN pnpm install --no-frozen-lockfile --filter="./artifacts/api-server" --filter="./artifacts/edubharat" --filter="./lib/**"

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

# Copy Kokoro service source
COPY --from=builder /app/tts-service ./tts-service

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 3000

# Health check hits the real health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/healthz', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["sh", "-c", "python -m uvicorn tts-service.main:app --host 127.0.0.1 --port 8001 & exec node --enable-source-maps ./artifacts/api-server/dist/index.mjs"]

