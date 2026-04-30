import { describe, it, expect } from 'bun:test'
import { Wallet } from '@/domain/wallet'

describe('Wallet', () => {
  it('começa com saldo zero', () => {
    const wallet = new Wallet('1', 'player1')
    expect(wallet.balanceCents).toBe(0n)
  })

  it('credita saldo corretamente', () => {
    const wallet = new Wallet('1', 'player1', 500n)
    wallet.credit(300n)
    expect(wallet.balanceCents).toBe(800n)
  })

  it('debita saldo corretamente', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    wallet.debit(400n)
    expect(wallet.balanceCents).toBe(600n)
  })

  it('lança erro se saldo insuficiente', () => {
    const wallet = new Wallet('1', 'player1', 100n)
    expect(() => wallet.debit(200n)).toThrow('Saldo insuficiente')
  })

  it('nunca usa float — opera em centavos inteiros', () => {
    const wallet = new Wallet('1', 'player1', 0n)
    wallet.credit(199n)
    wallet.debit(99n)
    expect(wallet.balanceCents).toBe(100n)
    expect(typeof wallet.balanceCents).toBe('bigint')
  })
})
