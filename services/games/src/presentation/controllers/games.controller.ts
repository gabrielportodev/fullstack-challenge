import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { HealthCheckResponseDto } from '@/presentation/dtos/health-check-response.dto'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'
import { CrashPoint } from '@/domain/crash-point'
import { PrismaService } from '@/infrastructure/prisma.service'

@Controller()
export class GamesController {
  constructor(
    private readonly placeBet: PlaceBetUseCase,
    private readonly cashoutBet: CashoutBetUseCase,
    private readonly getCurrentRound: GetCurrentRoundUseCase,
    private readonly getRoundHistory: GetRoundHistoryUseCase,
    private readonly prisma: PrismaService
  ) {}

  @Get('health')
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'games' }
  }

  @Get('rounds/current')
  async current() {
    return this.getCurrentRound.execute()
  }

  @Get('rounds/history')
  async history(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.getRoundHistory.execute(Number(page), Number(limit))
  }

  @Get('rounds/:roundId/verify')
  async verify(@Param('roundId') roundId: string) {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } })

    return {
      roundId: round.id,
      seedHash: round.seedHash,
      serverSeed: round.status === 'CRASHED' ? round.serverSeed : null,
      crashPoint: round.status === 'CRASHED' ? round.crashPoint : null,
      verified: round.status === 'CRASHED' ? CrashPoint.verify(round.serverSeed) === round.crashPoint : null
    }
  }

  @Get('bets/me')
  @UseGuards(AuthGuard('jwt'))
  async myBets(@Request() req: { user: { id: string } }, @Query('page') page = '1', @Query('limit') limit = '20') {
    const skip = (Number(page) - 1) * Number(limit)

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: { playerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      this.prisma.bet.count({ where: { playerId: req.user.id } })
    ])

    return { bets, total, page: Number(page), limit: Number(limit) }
  }

  @Post('bet')
  @UseGuards(AuthGuard('jwt'))
  async bet(@Request() req: { user: { id: string } }, @Body() body: { amountCents: number }) {
    return this.placeBet.execute(req.user.id, BigInt(body.amountCents))
  }

  @Post('bet/cashout')
  @UseGuards(AuthGuard('jwt'))
  async cashout(@Request() req: { user: { id: string } }, @Body() body: { multiplier: number }) {
    return this.cashoutBet.execute(req.user.id, body.multiplier)
  }
}
