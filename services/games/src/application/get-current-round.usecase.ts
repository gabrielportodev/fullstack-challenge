import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class GetCurrentRoundUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const round = await this.prisma.round.findFirst({
      where: { status: { in: ['BETTING', 'ACTIVE'] } },
      include: { bets: true }
    })

    if (!round) {
      throw new NotFoundException('Nenhuma rodada em andamento')
    }

    return round
  }
}
