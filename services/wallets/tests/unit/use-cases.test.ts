import { describe, it, expect, mock } from 'bun:test'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { CreateWalletUseCase } from '@/application/create-wallet.usecase'
import { GetWalletUseCase } from '@/application/get-wallet.usecase'
import { CreditWalletUseCase } from '@/application/credit-wallet.usecase'
import { DebitWalletUseCase } from '@/application/debit-wallet.usecase'

const mockWalletRecord = { id: 'w1', playerId: 'p1', balanceCents: 1000n, createdAt: new Date(), updatedAt: new Date() }

function makePrisma(overrides = {}) {
  return {
    wallet: {
      findUnique: mock(() => null),
      create: mock(() => mockWalletRecord),
      update: mock(() => mockWalletRecord),
      ...overrides
    }
  } as any
}

describe('CreateWalletUseCase', () => {
  it('cria carteira com sucesso', async () => {
    const prisma = makePrisma({ findUnique: mock(() => null) })
    const useCase = new CreateWalletUseCase(prisma)
    const result = await useCase.execute('p1')
    expect(result).toEqual(mockWalletRecord)
  })

  it('lança erro se carteira já existe', async () => {
    const prisma = makePrisma({ findUnique: mock(() => mockWalletRecord) })
    const useCase = new CreateWalletUseCase(prisma)
    expect(useCase.execute('p1')).rejects.toThrow(ConflictException)
  })
})

describe('GetWalletUseCase', () => {
  it('retorna carteira existente', async () => {
    const prisma = makePrisma({ findUnique: mock(() => mockWalletRecord) })
    const useCase = new GetWalletUseCase(prisma)
    const result = await useCase.execute('p1')
    expect(result).toEqual(mockWalletRecord)
  })

  it('lança erro se carteira não existe', async () => {
    const prisma = makePrisma({ findUnique: mock(() => null) })
    const useCase = new GetWalletUseCase(prisma)
    expect(useCase.execute('p1')).rejects.toThrow(NotFoundException)
  })
})

describe('CreditWalletUseCase', () => {
  it('credita e persiste saldo atualizado', async () => {
    const prisma = makePrisma({
      findUnique: mock(() => mockWalletRecord),
      update: mock(() => ({ ...mockWalletRecord, balanceCents: 1500n }))
    })
    const useCase = new CreditWalletUseCase(prisma)
    const result = await useCase.execute('p1', 500n)
    expect(result.balanceCents).toBe(1500n)
  })
})

describe('DebitWalletUseCase', () => {
  it('debita e persiste saldo atualizado', async () => {
    const prisma = makePrisma({
      findUnique: mock(() => mockWalletRecord),
      update: mock(() => ({ ...mockWalletRecord, balanceCents: 500n }))
    })
    const useCase = new DebitWalletUseCase(prisma)
    const result = await useCase.execute('p1', 500n)
    expect(result.balanceCents).toBe(500n)
  })

  it('lança erro se saldo insuficiente', async () => {
    const prisma = makePrisma({ findUnique: mock(() => mockWalletRecord) })
    const useCase = new DebitWalletUseCase(prisma)
    expect(useCase.execute('p1', 9999n)).rejects.toThrow('Saldo insuficiente')
  })
})
