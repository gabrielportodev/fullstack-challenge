import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/prisma.service'

@Injectable()
export class GetRoundHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [rounds, total] = await Promise.all([
      this.prisma.round.findMany({
        where: { status: 'CRASHED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          crashPoint: true,
          seedHash: true,
          startedAt: true,
          crashedAt: true,
          createdAt: true
        }
      }),
      this.prisma.round.count({ where: { status: 'CRASHED' } })
    ])

    return { rounds, total, page, limit }
  }
}
