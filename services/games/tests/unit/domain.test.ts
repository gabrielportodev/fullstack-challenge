import { describe, it, expect } from 'bun:test'
import { createHash } from 'crypto'
import { Round } from '@/domain/round'
import { Bet } from '@/domain/bet'
import { CrashPoint } from '@/domain/crash-point'

describe('CrashPoint', () => {
  it('gera crash point determinístico', () => {
    const cp = CrashPoint.generate()
    expect(CrashPoint.verify(cp.serverSeed)).toBe(cp.value)
  })

  it('produz o mesmo valor para a mesma seed (reprodutível)', () => {
    const cp = CrashPoint.generate()
    expect(CrashPoint.verify(cp.serverSeed)).toBe(CrashPoint.verify(cp.serverSeed))
  })

  it('seedHash é SHA256 do serverSeed (hash chain verificável)', () => {
    const cp = CrashPoint.generate()
    const expected = createHash('sha256').update(cp.serverSeed).digest('hex')
    expect(cp.seedHash).toBe(expected)
  })

  it('seedHash é diferente do serverSeed', () => {
    const cp = CrashPoint.generate()
    expect(cp.seedHash).not.toBe(cp.serverSeed)
  })

  it('crash point é >= 1.00x', () => {
    for (let i = 0; i < 20; i++) {
      const cp = CrashPoint.generate()
      expect(cp.value).toBeGreaterThanOrEqual(1.0)
    }
  })
})

describe('Bet', () => {
  it('cria aposta com status PENDING', () => {
    const bet = new Bet('b1', 'r1', 'p1', 1000n)
    expect(bet.status).toBe('PENDING')
  })

  it('rejeita aposta abaixo do mínimo', () => {
    expect(() => new Bet('b1', 'r1', 'p1', 99n)).toThrow('Aposta mínima')
  })

  it('rejeita aposta acima do máximo', () => {
    expect(() => new Bet('b1', 'r1', 'p1', 100_001n)).toThrow('Aposta máxima')
  })

  it('calcula cashout corretamente', () => {
    const bet = new Bet('b1', 'r1', 'p1', 1000n)
    bet.cashout(2.5)
    expect(bet.status).toBe('CASHED_OUT')
    expect(bet.cashoutPayoutCents).toBe(2500n)
    expect(bet.cashoutMultiplier).toBe(2.5)
  })

  it('marca como LOST', () => {
    const bet = new Bet('b1', 'r1', 'p1', 1000n)
    bet.lose()
    expect(bet.status).toBe('LOST')
  })
})

describe('Round', () => {
  it('começa no estado BETTING', () => {
    const round = new Round('r1')
    expect(round.status).toBe('BETTING')
  })

  it('aceita aposta na fase BETTING', () => {
    const round = new Round('r1')
    round.placeBet(new Bet('b1', 'r1', 'p1', 1000n))
    expect(round.bets).toHaveLength(1)
  })

  it('rejeita aposta duplicada do mesmo jogador', () => {
    const round = new Round('r1')
    round.placeBet(new Bet('b1', 'r1', 'p1', 1000n))
    expect(() => round.placeBet(new Bet('b2', 'r1', 'p1', 500n))).toThrow('já apostou')
  })

  it('transição BETTING → ACTIVE', () => {
    const round = new Round('r1')
    round.start()
    expect(round.status).toBe('ACTIVE')
  })

  it('rejeita aposta na fase ACTIVE', () => {
    const round = new Round('r1')
    round.start()
    expect(() => round.placeBet(new Bet('b1', 'r1', 'p1', 1000n))).toThrow('Apostas encerradas')
  })

  it('transição ACTIVE → CRASHED e perde apostas pendentes', () => {
    const round = new Round('r1')
    round.placeBet(new Bet('b1', 'r1', 'p1', 1000n))
    round.start()
    round.crash()
    expect(round.status).toBe('CRASHED')
    expect(round.bets[0].status).toBe('LOST')
  })

  it('permite cashout na fase ACTIVE', () => {
    const round = new Round('r1')
    round.placeBet(new Bet('b1', 'r1', 'p1', 1000n))
    round.start()
    const bet = round.cashoutBet('p1', 2.0)
    expect(bet.status).toBe('CASHED_OUT')
  })

  it('não pode sacar sem aposta', () => {
    const round = new Round('r1')
    round.start()
    expect(() => round.cashoutBet('p1', 2.0)).toThrow('Aposta não encontrada')
  })
})
