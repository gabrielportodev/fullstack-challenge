import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class DebitWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string, amountCents: bigint) {
    const wallet = await this.prisma.wallet.findUnique({ where: { playerId } })

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada!')
    }

    if (wallet.balanceCents < amountCents) {
      throw new BadRequestException('Saldo insuficiente')
    }

    return this.prisma.wallet.update({
      where: { playerId },
      data: { balanceCents: { decrement: amountCents } }
    })
  }
}
