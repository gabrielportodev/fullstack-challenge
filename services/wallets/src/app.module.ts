import { Module } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'
import { RabbitMQConsumer } from '@/infrastructure/rabbitmq.consumer'
import { CreateWalletUseCase } from '@/application/create-wallet.usecase'
import { GetWalletUseCase } from '@/application/get-wallet.usecase'
import { CreditWalletUseCase } from '@/application/credit-wallet.usecase'
import { DebitWalletUseCase } from '@/application/debit-wallet.usecase'
import { WalletsController } from '@/presentation/controllers/wallets.controller'

@Module({
  controllers: [WalletsController, RabbitMQConsumer],
  providers: [PrismaService, CreateWalletUseCase, GetWalletUseCase, CreditWalletUseCase, DebitWalletUseCase]
})
export class AppModule {}
