import { Prisma } from '@prisma/client'
import { Bet } from '@/domain/bet'
import { Round } from '@/domain/round'

export type RoundWithBets = Prisma.RoundGetPayload<{ include: { bets: true } }>

export function hydrateRound(record: RoundWithBets): Round {
  return Object.assign(new Round(record.id), {
    status: record.status,
    bets: record.bets.map(b => Object.assign(new Bet(b.id, b.roundId, b.playerId, b.amountCents), { status: b.status }))
  })
}
