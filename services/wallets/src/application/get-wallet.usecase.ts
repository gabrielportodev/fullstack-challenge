import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class GetWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { playerId } })
    if (!wallet) throw new NotFoundException('Carteira não encontrada')
    return wallet
  }
}
