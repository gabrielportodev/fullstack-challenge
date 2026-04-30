import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { GamesController } from './presentation/controllers/games.controller'
import { GameGateway } from '@/presentation/gateways/game.gateway'
import { PrismaService } from '@/infrastructure/prisma.service'
import { JwtStrategy } from '@/infrastructure/jwt.strategy'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'
import { GameLoopService } from '@/application/game-loop.service'

@Module({
  imports: [PassportModule],
  controllers: [GamesController],
  providers: [
    PrismaService,
    JwtStrategy,
    PlaceBetUseCase,
    CashoutBetUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GameLoopService,
    GameGateway
  ]
})
export class AppModule {}
