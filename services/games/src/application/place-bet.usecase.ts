import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { hydrateRound } from '@/infrastructure/round.mapper'
import { Bet } from '@/domain/bet'
import { randomUUID } from 'crypto'

@Injectable()
export class PlaceBetUseCase {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.bet.create({
      data: {
        id: bet.id,
        roundId: bet.roundId,
        playerId: bet.playerId,
        amountCents: bet.amountCents
      }
    })
  }
}
