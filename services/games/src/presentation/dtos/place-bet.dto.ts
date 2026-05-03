import { ApiProperty } from '@nestjs/swagger'

export class PlaceBetDto {
  @ApiProperty({
    description: 'Valor da aposta em centavos (inteiro). Ex: R$ 50,00 → 5000',
    example: 5000
  })
  amountCents: number

  @ApiProperty({
    description: 'Multiplicador alvo opcional para saque automático (mínimo 1.01x)',
    example: 2.0,
    required: false
  })
  autoCashoutMultiplier?: number
}
