export interface Round {
  id: string
  status: 'BETTING' | 'ACTIVE' | 'CRASHED'
  seedHash: string
  startedAt: string | null
  crashedAt: string | null
  createdAt: string
  bets: Bet[]
}

export interface Bet {
  id: string
  roundId: string
  playerId: string
  amountCents: string
  status: 'PENDING' | 'CASHED_OUT' | 'LOST'
  cashoutMultiplier: number | null
  cashoutPayoutCents: string | null
  createdAt: string
}

export interface RoundHistoryResponse {
  rounds: Round[]
  total: number
  page: number
}

export interface BetsResponse {
  bets: Bet[]
  total: number
  page: number
  limit: number
}

export interface VerifyRoundResponse {
  roundId: string
  seedHash: string
  serverSeed: string | null
  crashPoint: number | null
  verified: boolean | null
}
