import { describe, it, expect } from 'bun:test'
import { Wallet } from '@/domain/wallet'

describe('Wallet', () => {
  it('começa com saldo zero', () => {
    const wallet = new Wallet('1', 'player1')
    expect(wallet.balanceCents).toBe(0n)
  })

  it('cria carteira com saldo inicial informado', () => {
    const wallet = new Wallet('1', 'player1', 100000n)
    expect(wallet.balanceCents).toBe(100000n)
  })

  it('credita saldo corretamente', () => {
    const wallet = new Wallet('1', 'player1', 500n)
    wallet.credit(300n)
    expect(wallet.balanceCents).toBe(800n)
  })

  it('acumula múltiplos créditos corretamente', () => {
    const wallet = new Wallet('1', 'player1', 0n)
    wallet.credit(1000n)
    wallet.credit(2000n)
    expect(wallet.balanceCents).toBe(3000n)
  })

  it('lança erro se tentar creditar zero', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    expect(() => wallet.credit(0n)).toThrow('O valor deve ser positivo')
  })

  it('lança erro se tentar creditar valor negativo', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    expect(() => wallet.credit(-1n)).toThrow('O valor deve ser positivo')
  })

  it('debita saldo corretamente', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    wallet.debit(400n)
    expect(wallet.balanceCents).toBe(600n)
  })

  it('permite zerar o saldo exatamente', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    wallet.debit(1000n)
    expect(wallet.balanceCents).toBe(0n)
  })

  it('lança erro se saldo insuficiente', () => {
    const wallet = new Wallet('1', 'player1', 100n)
    expect(() => wallet.debit(200n)).toThrow('Saldo insuficiente')
  })

  it('não altera o saldo quando debit lança erro', () => {
    const wallet = new Wallet('1', 'player1', 500n)
    expect(() => wallet.debit(600n)).toThrow()
    expect(wallet.balanceCents).toBe(500n)
  })

  it('lança erro se tentar debitar zero', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    expect(() => wallet.debit(0n)).toThrow('O valor deve ser positivo')
  })

  it('lança erro se tentar debitar valor negativo', () => {
    const wallet = new Wallet('1', 'player1', 1000n)
    expect(() => wallet.debit(-1n)).toThrow('O valor deve ser positivo')
  })

  it('nunca usa float — opera em centavos inteiros', () => {
    const wallet = new Wallet('1', 'player1', 0n)
    wallet.credit(199n)
    wallet.debit(99n)
    expect(wallet.balanceCents).toBe(100n)
    expect(typeof wallet.balanceCents).toBe('bigint')
  })

  it('precisão monetária: opera em grandes valores sem perda', () => {
    const wallet = new Wallet('1', 'player1', 100_000_000n) // R$1.000.000,00
    wallet.credit(50_000_000n)
    wallet.debit(25_000_000n)
    expect(wallet.balanceCents).toBe(125_000_000n)
    expect(typeof wallet.balanceCents).toBe('bigint')
  })
})
