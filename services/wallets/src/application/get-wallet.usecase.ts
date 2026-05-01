import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

const INITIAL_BALANCE_CENTS = 100000n // R$1000

@Injectable()
export class GetWalletUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(playerId: string) {
    return this.prisma.wallet.upsert({
      where: { playerId },
      update: {},
      create: { playerId, balanceCents: INITIAL_BALANCE_CENTS }
    })
  }
}
