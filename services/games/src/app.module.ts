import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { GamesController } from './presentation/controllers/games.controller'
import { GameGateway } from '@/presentation/gateways/game.gateway'
import { PrismaService } from '@/infrastructure/prisma.service'
import { JwtStrategy } from '@/infrastructure/jwt.strategy'
import { RabbitMQPublisher } from '@/infrastructure/rabbitmq.publisher'
import { RabbitMQConsumer } from '@/infrastructure/rabbitmq.consumer'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'
import { GameLoopService } from '@/application/game-loop.service'

@Module({
  imports: [
    PassportModule,
    ClientsModule.register([
      {
        name: 'WALLETS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL as string],
          queue: 'wallets_queue',
          queueOptions: { durable: true }
        }
      }
    ])
  ],
  controllers: [GamesController, RabbitMQConsumer],
  providers: [
    PrismaService,
    JwtStrategy,
    RabbitMQPublisher,
    PlaceBetUseCase,
    CashoutBetUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GameLoopService,
    GameGateway
  ]
})
export class AppModule {}
