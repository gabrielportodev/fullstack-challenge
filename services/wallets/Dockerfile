FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock* ./
COPY packages/types/package.json ./packages/types/package.json
COPY services/wallets/package.json ./services/wallets/package.json
COPY frontend/package.json ./frontend/package.json
RUN bun install

COPY packages/types/ ./packages/types/
COPY services/wallets/ ./services/wallets/

WORKDIR /app/services/wallets

EXPOSE 4002

CMD ["bun", "run", "src/main.ts"]
