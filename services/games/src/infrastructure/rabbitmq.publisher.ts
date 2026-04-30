import { Injectable, Inject } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'

@Injectable()
export class RabbitMQPublisher {
  constructor(@Inject('WALLETS_SERVICE') private readonly client: ClientProxy) {}

  debitWallet(betId: string, playerId: string, amountCents: bigint) {
    this.client.emit('wallet.debit', {
      betId,
      playerId,
      amountCents: amountCents.toString()
    })
  }

  creditWallet(playerId: string, amountCents: bigint) {
    this.client.emit('wallet.credit', {
      playerId,
      amountCents: amountCents.toString()
    })
  }
}
