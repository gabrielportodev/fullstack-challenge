import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { hydrateRound } from '@/infrastructure/round.mapper'
import { Bet } from '@/domain/bet'

@Injectable()
export class CashoutBetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string, multiplier: number) {
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

    return this.prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: 'CASHED_OUT',
        cashoutMultiplier: bet.cashoutMultiplier,
        cashoutPayoutCents: bet.cashoutPayoutCents
      }
    })
  }
}
