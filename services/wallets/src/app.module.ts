import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from '@/infrastructure/prisma.service'
import { JwtStrategy } from '@/infrastructure/jwt.strategy'
import { RabbitMQConsumer } from '@/infrastructure/rabbitmq.consumer'
import { CreateWalletUseCase } from '@/application/create-wallet.usecase'
import { GetWalletUseCase } from '@/application/get-wallet.usecase'
import { CreditWalletUseCase } from '@/application/credit-wallet.usecase'
import { DebitWalletUseCase } from '@/application/debit-wallet.usecase'
import { WalletsController } from '@/presentation/controllers/wallets.controller'

@Module({
  imports: [PassportModule],
  controllers: [WalletsController, RabbitMQConsumer],
  providers: [
    PrismaService,
    JwtStrategy,
    CreateWalletUseCase,
    GetWalletUseCase,
    CreditWalletUseCase,
    DebitWalletUseCase
  ]
})
export class AppModule {}
