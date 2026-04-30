import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { Wallet } from '@/domain/wallet'

@Injectable()
export class CreditWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string, amountCents: bigint) {
    const record = await this.prisma.wallet.findUnique({ where: { playerId } })

    if (!record) {
      throw new NotFoundException('Carteira não encontrada!')
    }

    const wallet = new Wallet(record.id, record.playerId, record.balanceCents)

    wallet.credit(amountCents)

    return this.prisma.wallet.update({
      where: { playerId },
      data: { balanceCents: wallet.balanceCents }
    })
  }
}
