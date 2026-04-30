FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY packages/types/package.json ./packages/types/package.json
COPY frontend/package.json ./frontend/package.json
RUN bun install

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/ ./
COPY packages/types/ ./packages/types/
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/frontend
CMD ["node", "server.js"]
