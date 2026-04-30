import { Bet } from '@/domain/bet'
import { CrashPoint } from '@/domain/crash-point'

export type RoundStatus = 'BETTING' | 'ACTIVE' | 'CRASHED'

export class Round {
  id: string
  status: RoundStatus
  crashPoint: CrashPoint
  bets: Bet[]
  startedAt: Date | null
  crashedAt: Date | null

  constructor(id: string) {
    this.id = id
    this.status = 'BETTING'
    this.crashPoint = CrashPoint.generate()
    this.bets = []
    this.startedAt = null
    this.crashedAt = null
  }

  placeBet(bet: Bet): void {
    if (this.status !== 'BETTING') throw new Error('Apostas encerradas para esta rodada')
    const exists = this.bets.find(b => b.playerId === bet.playerId)
    if (exists) throw new Error('Jogador já apostou nesta rodada')
    this.bets.push(bet)
  }

  start(): void {
    if (this.status !== 'BETTING') throw new Error('Rodada já iniciada')
    this.status = 'ACTIVE'
    this.startedAt = new Date()
  }

  cashoutBet(playerId: string, multiplier: number): Bet {
    if (this.status !== 'ACTIVE') throw new Error('Rodada não está ativa')
    const bet = this.bets.find(b => b.playerId === playerId)
    if (!bet) throw new Error('Aposta não encontrada')
    bet.cashout(multiplier)
    return bet
  }

  crash(): void {
    if (this.status !== 'ACTIVE') throw new Error('Rodada não está ativa')
    this.status = 'CRASHED'
    this.crashedAt = new Date()
    for (const bet of this.bets) {
      if (bet.status === 'PENDING') bet.lose()
    }
  }
}
