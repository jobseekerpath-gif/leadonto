# Build stage
FROM node:20-slim AS builder

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --no-frozen-lockfile --filter="./artifacts/api-server" --filter="./artifacts/edubharat" --filter="./lib/**"
RUN pnpm --filter "./artifacts/api-server" run build
RUN pnpm --filter "./artifacts/edubharat" run build

# Runtime stage
FROM node:20-slim
WORKDIR /app

# Kokoro requires Python, PyTorch, eSpeak NG and libsndfile at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv espeak-ng libsndfile1 && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/kokoro-venv
ENV PATH="/opt/kokoro-venv/bin:$PATH"
COPY tts-service/requirements.txt ./tts-service/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r ./tts-service/requirements.txt

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/edubharat/dist/public ./artifacts/api-server/dist/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY tts-service/main.py ./tts-service/main.py

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD node -e "require('http').get('http://localhost:3000/api/healthz', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["sh", "-c", "uvicorn main:app --app-dir /app/tts-service --host 127.0.0.1 --port 8001 & exec node --enable-source-maps ./artifacts/api-server/dist/index.mjs"]
