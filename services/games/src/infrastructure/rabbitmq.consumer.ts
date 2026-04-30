import { Controller, Logger } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PrismaService } from '@/infrastructure/prisma.service'
import { GameLoopService, GAME_EVENTS } from '@/application/game-loop.service'

@Controller()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly gameLoop: GameLoopService
  ) {}

  // Compensação: débito falhou (saldo insuficiente) → cancela a aposta
  @MessagePattern('wallet.debit.failed')
  async handleDebitFailed(@Payload() data: { betId: string; reason: string }) {
    this.logger.warn(`Aposta ${data.betId} cancelada: ${data.reason}`)

    await this.prisma.bet.delete({ where: { id: data.betId } })

    this.gameLoop.emit(GAME_EVENTS.BET_CANCELLED, {
      betId: data.betId,
      reason: data.reason
    })
  }
}
