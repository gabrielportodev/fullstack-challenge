import { ApiProperty } from '@nestjs/swagger'

export class PlaceBetDto {
  @ApiProperty({
    description: 'Valor da aposta em centavos (inteiro). Ex: R$ 50,00 → 5000',
    example: 5000
  })
  amountCents: number
}
