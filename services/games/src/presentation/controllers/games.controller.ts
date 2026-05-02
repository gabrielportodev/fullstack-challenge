import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiOkResponse, ApiCreatedResponse, ApiBody } from '@nestjs/swagger'
import type { ArrayResponseType, ResponseType } from '@crash/types'
import { HealthCheckResponseDto } from '@/presentation/dtos/health-check-response.dto'
import { PlaceBetDto } from '@/presentation/dtos/place-bet.dto'
import { CashoutBetDto } from '@/presentation/dtos/cashout-bet.dto'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'
import { CrashPoint } from '@/domain/crash-point'
import { PrismaService } from '@/infrastructure/prisma.service'

@ApiTags('game')
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
  @ApiOperation({ summary: 'Health check do serviço de games' })
  @ApiOkResponse({
    description: 'Serviço saudável',
    schema: { example: { status: 'ok', service: 'games' } }
  })
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'games' }
  }

  @Get('rounds/current')
  @ApiOperation({ summary: 'Retorna a rodada atual com suas apostas' })
  @ApiOkResponse({
    description: 'Rodada em fase BETTING ou ACTIVE',
    schema: {
      example: {
        success: true,
        message: '',
        data: {
          id: 'a1b2c3d4-0000-0000-0000-000000000001',
          status: 'BETTING',
          seedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          startedAt: null,
          createdAt: '2024-01-15T10:00:00.000Z',
          bets: [
            {
              id: 'b2c3d4e5-0000-0000-0000-000000000002',
              playerId: 'user-uuid-from-keycloak',
              amountCents: '5000',
              status: 'PENDING',
              cashoutMultiplier: null,
              cashoutPayoutCents: null,
              createdAt: '2024-01-15T10:00:05.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Nenhuma rodada em andamento' })
  async current(): Promise<ResponseType<unknown>> {
    const data = await this.getCurrentRound.execute()
    return { success: true, message: '', data }
  }

  @Get('rounds/history')
  @ApiOperation({ summary: 'Histórico paginado de rodadas encerradas' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    description: 'Lista paginada de rodadas CRASHED',
    schema: {
      example: {
        success: true,
        message: '',
        data: [
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000001',
            crashPoint: 2.34,
            seedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            startedAt: '2024-01-15T10:00:10.000Z',
            crashedAt: '2024-01-15T10:00:23.000Z',
            createdAt: '2024-01-15T10:00:00.000Z'
          },
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000002',
            crashPoint: 1.02,
            seedHash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
            startedAt: '2024-01-15T10:01:00.000Z',
            crashedAt: '2024-01-15T10:01:01.000Z',
            createdAt: '2024-01-15T10:00:55.000Z'
          }
        ],
        meta: { page: 1, limit: 20, total: 142 }
      }
    }
  })
  async history(@Query('page') page = '1', @Query('limit') limit = '20'): Promise<ArrayResponseType<unknown>> {
    const res = await this.getRoundHistory.execute(Number(page), Number(limit))
    return {
      success: true,
      message: '',
      data: res.rounds,
      meta: { page: res.page, limit: Number(limit), total: res.total }
    }
  }

  @Get('rounds/:roundId/verify')
  @ApiOperation({ summary: 'Verificação Provably Fair de uma rodada encerrada' })
  @ApiParam({ name: 'roundId', description: 'UUID da rodada', example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  @ApiOkResponse({
    description: 'Dados de verificação criptográfica da rodada',
    schema: {
      example: {
        success: true,
        message: '',
        data: {
          roundId: 'a1b2c3d4-0000-0000-0000-000000000001',
          seedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          serverSeed: 'my-secret-random-seed-revealed',
          crashPoint: 2.34,
          verified: true
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Rodada não encontrada' })
  async verify(@Param('roundId') roundId: string): Promise<ResponseType<unknown>> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } })
    const data = {
      roundId: round.id,
      seedHash: round.seedHash,
      serverSeed: round.status === 'CRASHED' ? round.serverSeed : null,
      crashPoint: round.status === 'CRASHED' ? round.crashPoint : null,
      verified: round.status === 'CRASHED' ? CrashPoint.verify(round.serverSeed) === round.crashPoint : null
    }
    return { success: true, message: '', data }
  }

  @Get('bets/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histórico paginado de apostas do jogador autenticado' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    description: 'Lista paginada de apostas do jogador',
    schema: {
      example: {
        success: true,
        message: '',
        data: [
          {
            id: 'b2c3d4e5-0000-0000-0000-000000000010',
            roundId: 'a1b2c3d4-0000-0000-0000-000000000001',
            playerId: 'user-uuid-from-keycloak',
            amountCents: '5000',
            status: 'CASHED_OUT',
            cashoutMultiplier: 1.75,
            cashoutPayoutCents: '8750',
            createdAt: '2024-01-15T10:00:05.000Z'
          },
          {
            id: 'b2c3d4e5-0000-0000-0000-000000000011',
            roundId: 'a1b2c3d4-0000-0000-0000-000000000002',
            playerId: 'user-uuid-from-keycloak',
            amountCents: '10000',
            status: 'LOST',
            cashoutMultiplier: null,
            cashoutPayoutCents: null,
            createdAt: '2024-01-15T10:01:00.000Z'
          }
        ],
        meta: { page: 1, limit: 20, total: 37 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async myBets(
    @Request() req: { user: { id: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ): Promise<ArrayResponseType<unknown>> {
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
    return { success: true, message: '', data: bets, meta: { page: Number(page), limit: Number(limit), total } }
  }

  @Post('bet')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer aposta na rodada atual (fase BETTING)' })
  @ApiBody({ type: PlaceBetDto })
  @ApiCreatedResponse({
    description: 'Aposta registrada; débito processado assincronamente via RabbitMQ',
    schema: {
      example: {
        success: true,
        message: 'Aposta registrada',
        data: {
          id: 'b2c3d4e5-0000-0000-0000-000000000012',
          roundId: 'a1b2c3d4-0000-0000-0000-000000000004',
          playerId: 'user-uuid-from-keycloak',
          amountCents: '5000',
          status: 'PENDING',
          cashoutMultiplier: null,
          cashoutPayoutCents: null,
          createdAt: '2024-01-15T10:05:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Valor inválido ou aposta duplicada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Nenhuma rodada em fase de apostas' })
  async bet(
    @Request() req: { user: { id: string; username: string } },
    @Body() body: PlaceBetDto
  ): Promise<ResponseType<unknown>> {
    const data = await this.placeBet.execute(req.user.id, BigInt(body.amountCents), req.user.username)
    return { success: true, message: 'Aposta registrada', data }
  }

  @Post('bet/cashout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Realizar cashout no multiplicador atual (fase ACTIVE)' })
  @ApiBody({ type: CashoutBetDto })
  @ApiCreatedResponse({
    description: 'Cashout realizado; crédito processado assincronamente via RabbitMQ',
    schema: {
      example: {
        success: true,
        message: 'Cashout realizado',
        data: {
          id: 'b2c3d4e5-0000-0000-0000-000000000012',
          roundId: 'a1b2c3d4-0000-0000-0000-000000000004',
          playerId: 'user-uuid-from-keycloak',
          amountCents: '5000',
          status: 'CASHED_OUT',
          cashoutMultiplier: 1.75,
          cashoutPayoutCents: '8750',
          createdAt: '2024-01-15T10:05:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Sem aposta na rodada ou aposta já encerrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Nenhuma rodada ativa' })
  async cashout(
    @Request() req: { user: { id: string } },
    @Body() body: CashoutBetDto
  ): Promise<ResponseType<unknown>> {
    const data = await this.cashoutBet.execute(req.user.id, body.multiplier)
    return { success: true, message: 'Cashout realizado', data }
  }
}
