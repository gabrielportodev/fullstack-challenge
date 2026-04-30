import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
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

  @Post('wallets')
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req: { user: { id: string } }) {
    return this.createWallet.execute(req.user.id)
  }

  @Get('wallets/me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req: { user: { id: string } }) {
    return this.getWallet.execute(req.user.id)
  }
}
