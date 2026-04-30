import { Controller, Inject, Logger } from '@nestjs/common'
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices'
import { CreditWalletUseCase } from '@/application/credit-wallet.usecase'
import { DebitWalletUseCase } from '@/application/debit-wallet.usecase'

@Controller()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name)

  constructor(
    private readonly creditWallet: CreditWalletUseCase,
    private readonly debitWallet: DebitWalletUseCase,
    @Inject('GAMES_SERVICE') private readonly gamesClient: ClientProxy
  ) {}

  @MessagePattern('wallet.credit')
  async handleCredit(@Payload() data: { playerId: string; amountCents: number }) {
    await this.creditWallet.execute(data.playerId, BigInt(data.amountCents))
  }

  @MessagePattern('wallet.debit')
  async handleDebit(@Payload() data: { betId: string; playerId: string; amountCents: number }) {
    try {
      await this.debitWallet.execute(data.playerId, BigInt(data.amountCents))
    } catch (err) {
      this.logger.warn(`Débito falhou para bet ${data.betId}: ${err.message}`)
      this.gamesClient.emit('wallet.debit.failed', { betId: data.betId, reason: err.message })
    }
  }
}
