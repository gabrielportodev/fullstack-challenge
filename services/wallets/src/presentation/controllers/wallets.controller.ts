import { BadRequestException, Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { ResponseType } from '@crash/types'
import { HealthCheckResponseDto } from '@/presentation/dtos/health-check-response.dto'
import { CreateWalletUseCase } from '@/application/create-wallet.usecase'
import { GetWalletUseCase } from '@/application/get-wallet.usecase'
import { CreditWalletUseCase } from '@/application/credit-wallet.usecase'
import { DebitWalletUseCase } from '@/application/debit-wallet.usecase'

interface WalletAmountBody {
  amountCents?: number
}

@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase,
    private readonly creditWallet: CreditWalletUseCase,
    private readonly debitWallet: DebitWalletUseCase
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

  @Post('credit')
  @UseGuards(AuthGuard('jwt'))
  async credit(
    @Request() req: { user: { id: string } },
    @Body() body: WalletAmountBody
  ): Promise<ResponseType<unknown>> {
    const amountCents = this.parseAmount(body.amountCents)
    const data = await this.creditWallet.execute(req.user.id, BigInt(amountCents))
    return { success: true, message: 'Saldo creditado com sucesso!', data }
  }

  @Post('debit')
  @UseGuards(AuthGuard('jwt'))
  async debit(
    @Request() req: { user: { id: string } },
    @Body() body: WalletAmountBody
  ): Promise<ResponseType<unknown>> {
    const amountCents = this.parseAmount(body.amountCents)
    const data = await this.debitWallet.execute(req.user.id, BigInt(amountCents))
    return { success: true, message: 'Saldo debitado com sucesso!', data }
  }

  private parseAmount(amountCents: number | undefined): number {
    if (!Number.isInteger(amountCents) || !amountCents || amountCents <= 0) {
      throw new BadRequestException('amountCents deve ser um inteiro positivo')
    }

    return amountCents
  }
}
