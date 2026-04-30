import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { ResponseType } from '@crash/types'
import { HealthCheckResponseDto } from '@/presentation/dtos/health-check-response.dto'
import { CreateWalletUseCase } from '@/application/create-wallet.usecase'
import { GetWalletUseCase } from '@/application/get-wallet.usecase'

@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase
  ) {}

  @Get('health')
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'wallets' }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req: { user: { id: string } }): Promise<ResponseType<unknown>> {
    const data = await this.createWallet.execute(req.user.id)
    return { success: true, message: 'Carteira criada com sucesso!', data }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req: { user: { id: string } }): Promise<ResponseType<unknown>> {
    const data = await this.getWallet.execute(req.user.id)
    return { success: true, message: 'Carteira retornada com sucesso!', data }
  }
}
