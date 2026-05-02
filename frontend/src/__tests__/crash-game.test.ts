import { describe, expect, it } from 'bun:test'
import { AVATAR_COLORS, avatarColor, fmtBRL, fmtMult, multColor } from '../lib/crash-game'

describe('fmtBRL', () => {
  it('formata zero centavos', () => {
    expect(fmtBRL(0)).toBe('R$ 0,00')
  })

  it('formata 100 centavos como R$ 1,00', () => {
    expect(fmtBRL(100)).toBe('R$ 1,00')
  })

  it('formata 100000 centavos como R$ 1.000,00', () => {
    expect(fmtBRL(100000)).toBe('R$ 1.000,00')
  })

  it('formata valor máximo de aposta (R$ 1.000,00)', () => {
    expect(fmtBRL(100000)).toBe('R$ 1.000,00')
  })

  it('formata centavos fracionados corretamente', () => {
    expect(fmtBRL(150)).toBe('R$ 1,50')
  })
})

describe('fmtMult', () => {
  it('formata 1 como 1.00x', () => {
    expect(fmtMult(1)).toBe('1.00x')
  })

  it('formata 2.5 como 2.50x', () => {
    expect(fmtMult(2.5)).toBe('2.50x')
  })

  it('trunca para 2 casas decimais', () => {
    expect(fmtMult(10.123)).toBe('10.12x')
  })

  it('formata valores altos corretamente', () => {
    expect(fmtMult(100)).toBe('100.00x')
  })
})

describe('multColor', () => {
  it('retorna vermelho para multiplicador abaixo de 2x', () => {
    expect(multColor(1)).toBe('text-red-400')
    expect(multColor(1.99)).toBe('text-red-400')
  })

  it('retorna âmbar para multiplicador entre 2x e 4.99x', () => {
    expect(multColor(2)).toBe('text-amber-400')
    expect(multColor(4.99)).toBe('text-amber-400')
  })

  it('retorna verde para multiplicador de 5x ou mais', () => {
    expect(multColor(5)).toBe('text-emerald-400')
    expect(multColor(10)).toBe('text-emerald-400')
  })
})

describe('avatarColor', () => {
  it('retorna uma cor da paleta AVATAR_COLORS', () => {
    expect(AVATAR_COLORS).toContain(avatarColor('player'))
  })

  it('é determinístico para o mesmo nome', () => {
    expect(avatarColor('player')).toBe(avatarColor('player'))
    expect(avatarColor('admin')).toBe(avatarColor('admin'))
  })

  it('produz cores variadas para nomes distintos', () => {
    const cores = new Set(['alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace', 'henry'].map(avatarColor))
    expect(cores.size).toBeGreaterThan(1)
  })

  it('lida com string vazia sem lançar erro', () => {
    expect(() => avatarColor('')).not.toThrow()
    expect(AVATAR_COLORS).toContain(avatarColor(''))
  })
})
