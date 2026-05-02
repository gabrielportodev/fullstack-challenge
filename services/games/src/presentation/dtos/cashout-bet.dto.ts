import { ApiProperty } from '@nestjs/swagger'

export class CashoutBetDto {
  @ApiProperty({
    description: 'Multiplicador no momento do cashout. Deve ser ≤ ao multiplicador atual da rodada',
    example: 1.75
  })
  multiplier: number
}
