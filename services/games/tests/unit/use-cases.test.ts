import { describe, it, expect, mock } from 'bun:test'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { PlaceBetUseCase } from '@/application/place-bet.usecase'
import { CashoutBetUseCase } from '@/application/cashout-bet.usecase'
import { GetCurrentRoundUseCase } from '@/application/get-current-round.usecase'
import { GetRoundHistoryUseCase } from '@/application/get-round-history.usecase'
import { BetStatus } from '@/domain/bet'

const mockBetRecord = {
  id: 'b1',
  roundId: 'r1',
  playerId: 'p1',
  amountCents: 1000n,
  status: 'PENDING' as BetStatus,
  cashoutMultiplier: null,
  cashoutPayoutCents: null,
  createdAt: new Date()
}

const mockRoundRecord = {
  id: 'r1',
  status: 'BETTING',
  crashPoint: 2.5,
  serverSeed: 'seed',
  seedHash: 'hash',
  startedAt: null,
  crashedAt: null,
  createdAt: new Date(),
  bets: []
}

function makePrisma(overrides: Record<string, object> = {}) {
  return {
    round: {
      findFirst: mock(() => null),
      ...overrides.round
    },
    bet: {
      create: mock(() => mockBetRecord),
      update: mock(() => ({
        ...mockBetRecord,
        status: 'CASHED_OUT',
        cashoutMultiplier: 2.0,
        cashoutPayoutCents: 2000n
      })),
      findMany: mock(() => []),
      count: mock(() => 0),
      ...overrides.bet
    }
  } as any
}

const mockPublisher = { debitWallet: mock(() => {}), creditWallet: mock(() => {}) } as any
const mockGameLoop = { emit: mock(() => {}), getCurrentMultiplier: mock(() => 2.0) } as any

describe('PlaceBetUseCase', () => {
  it('registra aposta na rodada em BETTING', async () => {
    const prisma = makePrisma({ round: { findFirst: mock(() => mockRoundRecord) } })
    const useCase = new PlaceBetUseCase(prisma, mockPublisher, mockGameLoop)
    const result = await useCase.execute('p1', 1000n)
    expect(result).toEqual(mockBetRecord)
  })

  it('lança erro se não há rodada em BETTING', async () => {
    const prisma = makePrisma({ round: { findFirst: mock(() => null) } })
    const useCase = new PlaceBetUseCase(prisma, mockPublisher, mockGameLoop)
    expect(useCase.execute('p1', 1000n)).rejects.toThrow(NotFoundException)
  })

  it('lança erro se jogador já apostou na rodada', async () => {
    const roundComAposta = { ...mockRoundRecord, bets: [{ ...mockBetRecord }] }
    const prisma = makePrisma({ round: { findFirst: mock(() => roundComAposta) } })
    const useCase = new PlaceBetUseCase(prisma, mockPublisher, mockGameLoop)
    expect(useCase.execute('p1', 1000n)).rejects.toThrow(BadRequestException)
  })

  it('lança erro se valor da aposta for inválido', async () => {
    const prisma = makePrisma({ round: { findFirst: mock(() => mockRoundRecord) } })
    const useCase = new PlaceBetUseCase(prisma, mockPublisher, mockGameLoop)
    expect(useCase.execute('p1', 50n)).rejects.toThrow(BadRequestException)
  })
})

describe('CashoutBetUseCase', () => {
  it('processa cashout com sucesso', async () => {
    const roundAtivo = { ...mockRoundRecord, status: 'ACTIVE', bets: [{ ...mockBetRecord }] }
    const prisma = makePrisma({ round: { findFirst: mock(() => roundAtivo) } })
    const useCase = new CashoutBetUseCase(prisma, mockPublisher, mockGameLoop)
    const result = await useCase.execute('p1')
    expect(result.status).toBe('CASHED_OUT')
    expect(result.cashoutMultiplier).toBe(2.0)
  })

  it('lança erro se não há rodada ACTIVE', async () => {
    const prisma = makePrisma({ round: { findFirst: mock(() => null) } })
    const useCase = new CashoutBetUseCase(prisma, mockPublisher, mockGameLoop)
    expect(useCase.execute('p1')).rejects.toThrow(NotFoundException)
  })

  it('lança erro se jogador não tem aposta na rodada', async () => {
    const roundAtivo = { ...mockRoundRecord, status: 'ACTIVE', bets: [] }
    const prisma = makePrisma({ round: { findFirst: mock(() => roundAtivo) } })
    const useCase = new CashoutBetUseCase(prisma, mockPublisher, mockGameLoop)
    expect(useCase.execute('p1')).rejects.toThrow(BadRequestException)
  })

  it('lança erro se aposta já foi encerrada', async () => {
    const betJaEncerrada = { ...mockBetRecord, status: 'CASHED_OUT' }
    const roundAtivo = { ...mockRoundRecord, status: 'ACTIVE', bets: [betJaEncerrada] }
    const prisma = makePrisma({ round: { findFirst: mock(() => roundAtivo) } })
    const useCase = new CashoutBetUseCase(prisma, mockPublisher, mockGameLoop)
    expect(useCase.execute('p1')).rejects.toThrow(BadRequestException)
  })
})

describe('GetCurrentRoundUseCase', () => {
  it('retorna rodada em andamento', async () => {
    const prisma = makePrisma({ round: { findFirst: mock(() => mockRoundRecord) } })
    const useCase = new GetCurrentRoundUseCase(prisma)
    const result = await useCase.execute()
    expect(result.id).toBe('r1')
  })

  it('lança erro se nenhuma rodada está em andamento', async () => {
    const prisma = makePrisma({ round: { findFirst: mock(() => null) } })
    const useCase = new GetCurrentRoundUseCase(prisma)
    expect(useCase.execute()).rejects.toThrow(NotFoundException)
  })
})

describe('GetRoundHistoryUseCase', () => {
  it('retorna histórico paginado', async () => {
    const roundCrashado = { ...mockRoundRecord, status: 'CRASHED', crashedAt: new Date() }
    const prisma = {
      round: {
        findMany: mock(() => [roundCrashado]),
        count: mock(() => 1)
      }
    } as any
    const useCase = new GetRoundHistoryUseCase(prisma)
    const result = await useCase.execute(1, 20)
    expect(result.rounds).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
  })

  it('retorna lista vazia se não há rodadas crashadas', async () => {
    const prisma = {
      round: {
        findMany: mock(() => []),
        count: mock(() => 0)
      }
    } as any
    const useCase = new GetRoundHistoryUseCase(prisma)
    const result = await useCase.execute()
    expect(result.rounds).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})
