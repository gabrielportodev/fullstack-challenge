import { Module } from '@nestjs/common'
import { GamesController } from './presentation/controllers/games.controller'
import { PrismaService } from '@/infrastructure/prisma.service'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'

@Module({
  controllers: [GamesController],
  providers: [PrismaService, PlaceBetUseCase, CashoutBetUseCase, GetCurrentRoundUseCase, GetRoundHistoryUseCase]
})
export class AppModule {}
