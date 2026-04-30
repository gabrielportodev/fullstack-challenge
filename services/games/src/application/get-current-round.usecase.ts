import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class GetCurrentRoundUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const round = await this.prisma.round.findFirst({
      where: { status: { in: ['BETTING', 'ACTIVE'] } },
      select: {
        id: true,
        status: true,
        seedHash: true,
        startedAt: true,
        createdAt: true,
        bets: {
          select: {
            id: true,
            playerId: true,
            amountCents: true,
            status: true,
            cashoutMultiplier: true,
            cashoutPayoutCents: true,
            createdAt: true
          }
        }
      }
    })

    if (!round) {
      throw new NotFoundException('Nenhuma rodada em andamento')
    }

    return round
  }
}
