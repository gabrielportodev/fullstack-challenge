FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock* ./
COPY packages/types/package.json ./packages/types/package.json
COPY services/games/package.json ./services/games/package.json
COPY frontend/package.json ./frontend/package.json
RUN bun install

COPY packages/types/ ./packages/types/
COPY services/games/ ./services/games/

WORKDIR /app/services/games

EXPOSE 4001

CMD ["bun", "run", "src/main.ts"]
