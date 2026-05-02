import { describe, expect, it } from 'bun:test'
import { generateCodeChallenge, generateCodeVerifier, generateState, parseJwtClaims } from '../lib/auth'

describe('generateCodeVerifier', () => {
  it('retorna uma string não vazia', () => {
    const verifier = generateCodeVerifier()
    expect(typeof verifier).toBe('string')
    expect(verifier.length).toBeGreaterThan(0)
  })

  it('contém apenas caracteres base64url válidos', () => {
    expect(generateCodeVerifier()).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('gera valores únicos a cada chamada', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
  })
})

describe('generateCodeChallenge', () => {
  it('retorna uma string não vazia', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(typeof challenge).toBe('string')
    expect(challenge.length).toBeGreaterThan(0)
  })

  it('é diferente do verifier original', async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge).not.toBe(verifier)
  })

  it('é determinístico para o mesmo verifier', async () => {
    const verifier = 'verifier-fixo-para-teste'
    const [c1, c2] = await Promise.all([generateCodeChallenge(verifier), generateCodeChallenge(verifier)])
    expect(c1).toBe(c2)
  })

  it('contém apenas caracteres base64url válidos', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/)
  })
})

describe('generateState', () => {
  it('retorna uma string não vazia', () => {
    expect(typeof generateState()).toBe('string')
    expect(generateState().length).toBeGreaterThan(0)
  })

  it('gera valores únicos a cada chamada', () => {
    expect(generateState()).not.toBe(generateState())
  })
})

describe('parseJwtClaims', () => {
  const buildToken = (claims: object) => {
    const payload = btoa(JSON.stringify(claims))
    return `header.${payload}.signature`
  }

  it('extrai claims básicos corretamente', () => {
    const token = buildToken({
      sub: 'user-123',
      preferred_username: 'player',
      email: 'player@test.com',
      exp: 9999999999,
      iat: 1000000000
    })
    const claims = parseJwtClaims(token)
    expect(claims.sub).toBe('user-123')
    expect(claims.preferred_username).toBe('player')
    expect(claims.email).toBe('player@test.com')
    expect(claims.exp).toBe(9999999999)
    expect(claims.iat).toBe(1000000000)
  })

  it('aceita payload com encoding base64url (- e _)', () => {
    const claims = { sub: 'abc', preferred_username: 'x', email: 'x@x.com', exp: 1, iat: 1 }
    const payload = btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `header.${payload}.signature`
    const parsed = parseJwtClaims(token)
    expect(parsed.sub).toBe('abc')
  })

  it('lança erro para token malformado', () => {
    expect(() => parseJwtClaims('nao-e-um-jwt')).toThrow()
  })
})
