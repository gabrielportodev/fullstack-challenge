import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class DebitWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string, amountCents: bigint) {
    const exists = await this.prisma.wallet.findUnique({ where: { playerId }, select: { id: true } })

    if (!exists) {
      throw new NotFoundException('Carteira não encontrada!')
    }

    // updateMany com where no balance gera UPDATE atômico: SET balance = balance - X WHERE balance >= X
    const result = await this.prisma.wallet.updateMany({
      where: { playerId, balanceCents: { gte: amountCents } },
      data: { balanceCents: { decrement: amountCents } }
    })

    if (result.count === 0) {
      throw new BadRequestException('Saldo insuficiente')
    }

    return this.prisma.wallet.findUnique({ where: { playerId } })
  }
}
