export type BetStatus = 'PENDING' | 'CASHED_OUT' | 'LOST'

const MIN_BET = 100n
const MAX_BET = 100_000n

export class Bet {
  id: string
  roundId: string
  playerId: string
  amountCents: bigint
  status: BetStatus
  cashoutMultiplier: number | null
  cashoutPayoutCents: bigint | null

  constructor(id: string, roundId: string, playerId: string, amountCents: bigint) {
    if (amountCents < MIN_BET) throw new Error(`Aposta mínima é ${MIN_BET} cents`)
    if (amountCents > MAX_BET) throw new Error(`Aposta máxima é ${MAX_BET} cents`)

    this.id = id
    this.roundId = roundId
    this.playerId = playerId
    this.amountCents = amountCents
    this.status = 'PENDING'
    this.cashoutMultiplier = null
    this.cashoutPayoutCents = null
  }

  cashout(multiplier: number): void {
    if (this.status !== 'PENDING') throw new Error('Aposta já encerrada')
    this.status = 'CASHED_OUT'
    this.cashoutMultiplier = multiplier
    this.cashoutPayoutCents = BigInt(Math.floor(Number(this.amountCents) * multiplier))
  }

  lose(): void {
    if (this.status !== 'PENDING') throw new Error('Aposta já encerrada')
    this.status = 'LOST'
  }
}
