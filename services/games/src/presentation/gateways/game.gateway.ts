import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { GameLoopService, GAME_EVENTS } from '@/application/game-loop.service'

@Injectable()
@WebSocketGateway({ cors: { origin: ['http://localhost:3000'] } })
export class GameGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(GameGateway.name)

  constructor(private readonly gameLoop: GameLoopService) {}

  // Subscreve aos eventos do loop antes de o loop iniciar (onApplicationBootstrap)
  onModuleInit() {
    this.gameLoop.on(GAME_EVENTS.BETTING_START, data => this.server?.emit(GAME_EVENTS.BETTING_START, data))
    this.gameLoop.on(GAME_EVENTS.ROUND_STARTED, data => this.server?.emit(GAME_EVENTS.ROUND_STARTED, data))
    this.gameLoop.on(GAME_EVENTS.MULTIPLIER_TICK, data => this.server?.emit(GAME_EVENTS.MULTIPLIER_TICK, data))
    this.gameLoop.on(GAME_EVENTS.ROUND_CRASHED, data => this.server?.emit(GAME_EVENTS.ROUND_CRASHED, data))
  }

  // Envia estado atual para cliente recém-conectado
  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`)

    const round = this.gameLoop.getCurrentRound()
    if (!round) return

    if (round.status === 'BETTING') {
      client.emit(GAME_EVENTS.BETTING_START, {
        roundId: round.id,
        seedHash: round.crashPoint.seedHash,
        duration: 10_000
      })
    } else if (round.status === 'ACTIVE') {
      client.emit(GAME_EVENTS.ROUND_STARTED, { roundId: round.id })
      client.emit(GAME_EVENTS.MULTIPLIER_TICK, {
        multiplier: this.gameLoop.getCurrentMultiplier(),
        elapsed: 0
      })
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`)
  }

  broadcast(event: string, data: unknown) {
    this.server?.emit(event, data)
  }
}
