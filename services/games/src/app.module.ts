import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { GamesController } from './presentation/controllers/games.controller'
import { PrismaService } from '@/infrastructure/prisma.service'
import { JwtStrategy } from '@/infrastructure/jwt.strategy'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'

@Module({
  imports: [PassportModule],
  controllers: [GamesController],
  providers: [
    PrismaService,
    JwtStrategy,
    PlaceBetUseCase,
    CashoutBetUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase
  ]
})
export class AppModule {}
