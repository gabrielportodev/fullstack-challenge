import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { Wallet } from '@/domain/wallet'

@Injectable()
export class DebitWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string, amountCents: bigint) {
    const record = await this.prisma.wallet.findUnique({ where: { playerId } })

    if (!record) {
      throw new NotFoundException('Carteira não encontrada!')
    }

    const wallet = new Wallet(record.id, record.playerId, record.balanceCents)

    try {
      wallet.debit(amountCents)
    } catch (err) {
      throw new BadRequestException(err.message)
    }

    return this.prisma.wallet.update({
      where: { playerId },
      data: { balanceCents: wallet.balanceCents }
    })
  }
}
