import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { RabbitMQPublisher } from '@/infrastructure/rabbitmq.publisher'
import { hydrateRound } from '@/infrastructure/round.mapper'
import { GameLoopService, GAME_EVENTS } from '@/application/game-loop.service'
import { Bet } from '@/domain/bet'

@Injectable()
export class CashoutBetUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQPublisher,
    private readonly gameLoop: GameLoopService
  ) {}

  async execute(playerId: string) {
    const multiplier = this.gameLoop.getCurrentMultiplier()
    const record = await this.prisma.round.findFirst({
      where: { status: 'ACTIVE' },
      include: { bets: true }
    })

    if (!record) {
      throw new NotFoundException('Nenhuma rodada ativa')
    }

    const round = hydrateRound(record)

    let bet: Bet
    try {
      bet = round.cashoutBet(playerId, multiplier)
    } catch (err) {
      throw new BadRequestException(err.message)
    }

    const updated = await this.prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: 'CASHED_OUT',
        cashoutMultiplier: bet.cashoutMultiplier,
        cashoutPayoutCents: bet.cashoutPayoutCents
      }
    })

    // Credita o prêmio na carteira do jogador
    this.publisher.creditWallet(bet.playerId, bet.cashoutPayoutCents!)

    this.gameLoop.emit(GAME_EVENTS.BET_CASHOUT, {
      roundId: record.id,
      betId: bet.id,
      playerId: bet.playerId,
      multiplier: bet.cashoutMultiplier,
      payoutCents: bet.cashoutPayoutCents!.toString()
    })

    return updated
  }
}
