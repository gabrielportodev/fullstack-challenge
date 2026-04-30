import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { CreditWalletUseCase } from '@/application/credit-wallet.usecase'
import { DebitWalletUseCase } from '@/application/debit-wallet.usecase'

@Controller()
export class RabbitMQConsumer {
  constructor(
    private readonly creditWallet: CreditWalletUseCase,
    private readonly debitWallet: DebitWalletUseCase
  ) {}

  @MessagePattern('wallet.credit')
  async handleCredit(@Payload() data: { playerId: string; amountCents: number }) {
    await this.creditWallet.execute(data.playerId, BigInt(data.amountCents))
  }

  @MessagePattern('wallet.debit')
  async handleDebit(@Payload() data: { playerId: string; amountCents: number }) {
    await this.debitWallet.execute(data.playerId, BigInt(data.amountCents))
  }
}
