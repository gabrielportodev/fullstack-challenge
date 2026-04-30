import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { RabbitMQPublisher } from '@/infrastructure/rabbitmq.publisher'
import { hydrateRound } from '@/infrastructure/round.mapper'
import { GameLoopService, GAME_EVENTS } from '@/application/game-loop.service'
import { Bet } from '@/domain/bet'
import { randomUUID } from 'crypto'

@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQPublisher,
    private readonly gameLoop: GameLoopService
  ) {}

  async execute(playerId: string, amountCents: bigint) {
    const record = await this.prisma.round.findFirst({
      where: { status: 'BETTING' },
      include: { bets: true }
    })

    if (!record) {
      throw new NotFoundException('Nenhuma rodada aberta para apostas')
    }

    const round = hydrateRound(record)

    let bet: Bet
    try {
      bet = new Bet(randomUUID(), round.id, playerId, amountCents)
      round.placeBet(bet)
    } catch (err) {
      throw new BadRequestException(err.message)
    }

    const created = await this.prisma.bet.create({
      data: {
        id: bet.id,
        roundId: bet.roundId,
        playerId: bet.playerId,
        amountCents: bet.amountCents
      }
    })

    // Debita o saldo do jogador de forma assíncrona
    // Se falhar, wallet.debit.failed cancela a aposta via RabbitMQConsumer
    this.publisher.debitWallet(bet.id, bet.playerId, bet.amountCents)

    this.gameLoop.emit(GAME_EVENTS.BET_PLACED, {
      roundId: bet.roundId,
      betId: bet.id,
      playerId: bet.playerId,
      amountCents: bet.amountCents.toString()
    })

    return created
  }
}
