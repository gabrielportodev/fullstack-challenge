import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class CreditWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string, amountCents: bigint) {
    const exists = await this.prisma.wallet.findUnique({ where: { playerId }, select: { id: true } })

    if (!exists) {
      throw new NotFoundException('Carteira não encontrada!')
    }

    // Atomic increment — avoids lost-update race when concurrent credits arrive
    return this.prisma.wallet.update({
      where: { playerId },
      data: { balanceCents: { increment: amountCents } }
    })
  }
}
