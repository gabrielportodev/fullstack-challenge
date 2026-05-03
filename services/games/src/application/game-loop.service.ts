import { Injectable, OnApplicationBootstrap, OnModuleDestroy, Logger } from '@nestjs/common'
import { EventEmitter } from 'events'
import { PrismaService } from '@/infrastructure/prisma.service'
import { RabbitMQPublisher } from '@/infrastructure/rabbitmq.publisher'
import { Round } from '@/domain/round'
import { randomUUID } from 'crypto'

export const GAME_EVENTS = {
  BETTING_START: 'round:betting_start',
  ROUND_STARTED: 'round:started',
  MULTIPLIER_TICK: 'multiplier:tick',
  ROUND_CRASHED: 'round:crashed',
  BET_PLACED: 'bet:placed',
  BET_CASHOUT: 'bet:cashout',
  BET_CANCELLED: 'bet:cancelled'
} as const

const BETTING_DURATION_MS = 10_000
const CRASHED_COOLDOWN_MS = 5_000
const TICK_INTERVAL_MS = 100

@Injectable()
export class GameLoopService extends EventEmitter implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(GameLoopService.name)

  private currentRound: Round | null = null
  private currentMultiplier = 1.0
  private roundStartTime = 0
  private bettingEndsAt = 0
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private running = false
  private autoCashoutInProgress = new Set<string>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQPublisher
  ) {
    super()
  }

  async onApplicationBootstrap() {
    this.running = true
    await this.recoverFromRestart()
    this.runLoop().catch(err => this.logger.error('Erro no loop', err))
  }

  onModuleDestroy() {
    this.running = false
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  }

  getCurrentRound(): Round | null {
    return this.currentRound
  }

  getCurrentMultiplier(): number {
    return this.currentMultiplier
  }

  getBettingEndsAt(): number {
    return this.bettingEndsAt
  }

  private async runLoop() {
    while (this.running) {
      await this.runBettingPhase()
      if (!this.running) break
      await this.runActivePhase()
      if (!this.running) break
      await this.sleep(CRASHED_COOLDOWN_MS)
    }
  }

  private async runBettingPhase() {
    const round = new Round(randomUUID())
    this.currentRound = round
    this.currentMultiplier = 1.0

    await this.prisma.round.create({
      data: {
        id: round.id,
        status: 'BETTING',
        serverSeed: round.crashPoint.serverSeed,
        seedHash: round.crashPoint.seedHash,
        crashPoint: round.crashPoint.value
      }
    })

    this.bettingEndsAt = Date.now() + BETTING_DURATION_MS
    this.logger.log(`[BETTING] ${round.id.slice(0, 8)} | crash=${round.crashPoint.value}x`)

    this.emit(GAME_EVENTS.BETTING_START, {
      roundId: round.id,
      seedHash: round.crashPoint.seedHash,
      bettingEndsAt: this.bettingEndsAt
    })

    await this.sleep(BETTING_DURATION_MS)
  }

  private async runActivePhase() {
    if (!this.currentRound || !this.running) return

    this.currentRound.start()
    this.roundStartTime = Date.now()

    await this.prisma.round.update({
      where: { id: this.currentRound.id },
      data: { status: 'ACTIVE', startedAt: this.currentRound.startedAt }
    })

    const crashPoint = this.currentRound.crashPoint.value
    this.logger.log(`[ACTIVE] ${this.currentRound.id.slice(0, 8)} | crashPoint=${crashPoint}x`)

    this.emit(GAME_EVENTS.ROUND_STARTED, { roundId: this.currentRound.id })

    await new Promise<void>(resolve => {
      this.tickTimer = setInterval(() => {
        if (!this.running) {
          clearInterval(this.tickTimer!)
          this.tickTimer = null
          resolve()
          return
        }

        const elapsed = Date.now() - this.roundStartTime
        // Crescimento exponencial: ~1.35x em 5s, ~2x em 10s, ~7x em 20s
        this.currentMultiplier = Math.floor(Math.pow(Math.E, 0.0001 * elapsed) * 100) / 100

        this.emit(GAME_EVENTS.MULTIPLIER_TICK, {
          multiplier: this.currentMultiplier,
          elapsed
        })

        void this.processAutoCashouts(this.currentMultiplier, crashPoint)

        if (this.currentMultiplier >= crashPoint) {
          clearInterval(this.tickTimer!)
          this.tickTimer = null
          resolve()
        }
      }, TICK_INTERVAL_MS)
    })

    await this.crashRound()
  }

  private async processAutoCashouts(currentMultiplier: number, crashPoint: number) {
    if (!this.currentRound) return
    if (currentMultiplier >= crashPoint) return

    const candidates = await this.prisma.bet.findMany({
      where: {
        roundId: this.currentRound.id,
        status: 'PENDING',
        autoCashoutMultiplier: { not: null, lte: currentMultiplier }
      }
    })

    for (const record of candidates) {
      if (this.autoCashoutInProgress.has(record.id)) continue
      this.autoCashoutInProgress.add(record.id)

      const target = record.autoCashoutMultiplier!
      if (target > crashPoint) {
        this.autoCashoutInProgress.delete(record.id)
        continue
      }

      const multiplierBasisPoints = BigInt(Math.floor(target * 100))
      const payoutCents = (record.amountCents * multiplierBasisPoints) / 100n

      try {
        const updated = await this.prisma.bet.updateMany({
          where: { id: record.id, status: 'PENDING' },
          data: {
            status: 'CASHED_OUT',
            cashoutMultiplier: target,
            cashoutPayoutCents: payoutCents
          }
        })

        if (updated.count === 0) {
          this.autoCashoutInProgress.delete(record.id)
          continue
        }

        this.publisher.creditWallet(record.playerId, payoutCents)

        this.emit(GAME_EVENTS.BET_CASHOUT, {
          roundId: this.currentRound.id,
          betId: record.id,
          playerId: record.playerId,
          multiplier: target,
          payoutCents: payoutCents.toString(),
          auto: true
        })
      } catch (err) {
        this.logger.error(`Erro no auto cashout da aposta ${record.id}`, err)
        this.autoCashoutInProgress.delete(record.id)
      }
    }
  }

  private async crashRound() {
    if (!this.currentRound) return

    this.currentRound.crash()

    await this.prisma.$transaction([
      this.prisma.round.update({
        where: { id: this.currentRound.id },
        data: { status: 'CRASHED', crashedAt: this.currentRound.crashedAt }
      }),
      this.prisma.bet.updateMany({
        where: { roundId: this.currentRound.id, status: 'PENDING' },
        data: { status: 'LOST' }
      })
    ])

    this.logger.log(`[CRASHED] ${this.currentRound.id.slice(0, 8)} em ${this.currentMultiplier}x`)

    this.emit(GAME_EVENTS.ROUND_CRASHED, {
      roundId: this.currentRound.id,
      crashPoint: this.currentRound.crashPoint.value,
      serverSeed: this.currentRound.crashPoint.serverSeed
    })
  }

  // Encerra rodadas presas de restarts anteriores
  private async recoverFromRestart() {
    const stale = await this.prisma.round.findMany({
      where: { status: { in: ['ACTIVE', 'BETTING'] } }
    })

    for (const round of stale) {
      await this.prisma.$transaction([
        this.prisma.round.update({
          where: { id: round.id },
          data: { status: 'CRASHED', crashedAt: new Date() }
        }),
        this.prisma.bet.updateMany({
          where: { roundId: round.id, status: 'PENDING' },
          data: { status: 'LOST' }
        })
      ])
      this.logger.warn(`[RECOVERY] rodada ${round.id.slice(0, 8)} encerrada por restart`)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
