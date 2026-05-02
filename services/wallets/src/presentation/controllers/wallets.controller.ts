import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger'
import type { ResponseType } from '@crash/types'
import { HealthCheckResponseDto } from '@/presentation/dtos/health-check-response.dto'
import { CreateWalletUseCase } from '@/application/create-wallet.usecase'
import { GetWalletUseCase } from '@/application/get-wallet.usecase'

@ApiTags('wallet')
@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check do serviço de carteiras' })
  @ApiOkResponse({
    description: 'Serviço saudável',
    schema: { example: { status: 'ok', service: 'wallets' } }
  })
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'wallets' }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria a carteira do jogador autenticado' })
  @ApiCreatedResponse({
    description: 'Carteira criada com sucesso. Saldo inicial de R$ 1.000,00 (100000 centavos) aplicado via seed',
    schema: {
      example: {
        success: true,
        message: 'Carteira criada com sucesso!',
        data: {
          id: 'c3d4e5f6-0000-0000-0000-000000000020',
          playerId: 'user-uuid-from-keycloak',
          balanceCents: '100000',
          createdAt: '2024-01-15T09:00:00.000Z',
          updatedAt: '2024-01-15T09:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Carteira já existe para este jogador' })
  async create(@Request() req: { user: { id: string } }): Promise<ResponseType<unknown>> {
    const data = await this.createWallet.execute(req.user.id)
    return { success: true, message: 'Carteira criada com sucesso!', data }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna a carteira e saldo do jogador autenticado' })
  @ApiOkResponse({
    description: 'Carteira do jogador. balanceCents está em centavos (ex: 100000 = R$ 1.000,00)',
    schema: {
      example: {
        success: true,
        message: 'Carteira retornada com sucesso!',
        data: {
          id: 'c3d4e5f6-0000-0000-0000-000000000020',
          playerId: 'user-uuid-from-keycloak',
          balanceCents: '95000',
          createdAt: '2024-01-15T09:00:00.000Z',
          updatedAt: '2024-01-15T10:05:01.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  async getMe(@Request() req: { user: { id: string } }): Promise<ResponseType<unknown>> {
    const data = await this.getWallet.execute(req.user.id)
    return { success: true, message: 'Carteira retornada com sucesso!', data }
  }
}
