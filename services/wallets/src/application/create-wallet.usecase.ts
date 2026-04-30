import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class CreateWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { playerId } })

    if (existing) {
      throw new ConflictException('Esse jogador já possui uma carteira!')
    }

    const wallet = await this.prisma.wallet.create({
      data: { playerId, balanceCents: 0n }
    })

    return wallet
  }
}
