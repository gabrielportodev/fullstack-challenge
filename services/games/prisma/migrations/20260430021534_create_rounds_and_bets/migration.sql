-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('BETTING', 'ACTIVE', 'CRASHED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'CASHED_OUT', 'LOST');

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'BETTING',
    "crash_point" DOUBLE PRECISION NOT NULL,
    "server_seed" TEXT NOT NULL,
    "seed_hash" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "crashed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "cashout_multiplier" DOUBLE PRECISION,
    "cashout_payout_cents" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
