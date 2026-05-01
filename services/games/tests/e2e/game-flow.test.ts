import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { io, Socket } from 'socket.io-client'

const KONG_URL = process.env.TEST_KONG_URL ?? 'http://localhost:8000'
const KEYCLOAK_TOKEN_URL =
  process.env.TEST_KEYCLOAK_TOKEN_URL ?? 'http://localhost:8080/realms/crash-game/protocol/openid-connect/token'

const API_URL = `${KONG_URL}/games`
const WALLET_API_URL = `${KONG_URL}/wallets`

async function getToken(username: string) {
  const params = new URLSearchParams()
  params.append('grant_type', 'password')
  params.append('client_id', 'crash-game-client')
  params.append('username', username)
  params.append('password', `${username}123`)
  params.append('scope', 'openid')

  const res = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Auth failed for ${username}: ${err}`)
  }
  const data = await res.json()
  return data.access_token
}

async function ensureWallet(token: string) {
  await fetch(`${WALLET_API_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function getBalance(token: string) {
  const res = await fetch(`${WALLET_API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (res.status === 404) {
    await ensureWallet(token)
    return getBalance(token)
  }

  const json = await res.json()
  if (!res.ok) throw new Error(`Balance fetch failed: ${JSON.stringify(json)}`)
  return Number(json.data.balanceCents)
}

async function addBalance(token: string, amountCents: number) {
  await fetch(`${WALLET_API_URL}/credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amountCents })
  })
}

async function drainBalance(token: string, amountCents: number) {
  await fetch(`${WALLET_API_URL}/debit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amountCents })
  })
}

describe('Crash Game End-to-End Suite', () => {
  let socket: Socket

  afterAll(() => {
    if (socket) socket.disconnect()
  })

  test('Cenário de Vitória: Deve apostar e realizar cashout com lucro', async () => {
    const token = await getToken('player')
    await getBalance(token)
    await addBalance(token, 100000)

    const initialBalance = await getBalance(token)
    const betAmount = 1000

    socket = io('http://localhost:4001', { transports: ['websocket'] })

    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const betRes = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: betAmount })
    })
    expect(betRes.status).toBe(201)

    await new Promise<void>(r => socket.once('round:started', () => r()))

    let currentMult = 1.0
    let crashed = false

    await new Promise<void>(resolve => {
      const onTick = (data: { multiplier: number }) => {
        currentMult = data.multiplier
        if (currentMult >= 1.3) {
          socket.off('multiplier:tick', onTick)
          resolve()
        }
      }
      socket.on('multiplier:tick', onTick)
      socket.once('round:crashed', () => {
        crashed = true
        socket.off('multiplier:tick', onTick)
        resolve()
      })
    })

    if (crashed) {
      console.warn('⚠️ Crash precoce.')
      socket.disconnect()
      return
    }

    const cashoutRes = await fetch(`${API_URL}/bet/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ multiplier: currentMult })
    })
    expect(cashoutRes.status).toBe(201)

    await new Promise(r => setTimeout(r, 2000))
    const finalBalance = await getBalance(token)
    const expectedPayout = Math.round(betAmount * currentMult)

    expect(finalBalance).toBe(initialBalance - betAmount + expectedPayout)

    socket.disconnect()
  }, 90000)

  test('Cenário de Perda: Saldo deve ser reduzido após o crash', async () => {
    const token = await getToken('gabriel')
    await getBalance(token)
    await addBalance(token, 100000)

    const initialBalance = await getBalance(token)
    const betAmount = 500

    socket = io('http://localhost:4001', { transports: ['websocket'] })

    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const betRes = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: betAmount })
    })
    expect(betRes.status).toBe(201)

    await new Promise<void>(r => socket.once('round:crashed', () => r()))

    await new Promise(r => setTimeout(r, 2000))
    const finalBalance = await getBalance(token)

    expect(finalBalance).toBe(initialBalance - betAmount)

    socket.disconnect()
  }, 90000)

  test('Erro: Deve rejeitar aposta se o valor exceder o máximo', async () => {
    const token = await getToken('joao')

    // Aguarda fase de apostas para garantir erro de valor e não de fase
    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const res = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 200000 })
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message.toLowerCase()).toContain('máxima')

    socket.disconnect()
  }, 90000)

  test('Erro: Saldo insuficiente → aposta aceita mas cancelada por compensação', async () => {
    const token = await getToken('pedro')
    await ensureWallet(token)

    const currentBalance = await getBalance(token)
    if (currentBalance > 0) {
      await drainBalance(token, currentBalance)
    }

    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const betRes = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 10000 })
    })
    expect(betRes.status).toBe(201)
    const betBody = await betRes.json()
    const betId = betBody.data.id

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout: bet:cancelled não recebido')), 15000)
      socket.on('bet:cancelled', (data: { betId: string }) => {
        if (data.betId === betId) {
          clearTimeout(timer)
          resolve()
        }
      })
    })

    socket.disconnect()
  }, 90000)

  test('Erro: Aposta dupla na mesma rodada → segunda aposta rejeitada', async () => {
    const token = await getToken('joao')
    await getBalance(token)
    await addBalance(token, 50000)

    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const firstBet = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 1000 })
    })
    expect(firstBet.status).toBe(201)

    const secondBet = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 1000 })
    })
    expect(secondBet.status).toBe(400)
    const secondBody = await secondBet.json()
    expect(secondBody.message.toLowerCase()).toContain('já apostou')

    socket.disconnect()
  }, 90000)

  test('Erro: Apostar durante fase ACTIVE → aposta rejeitada', async () => {
    const token = await getToken('player')

    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:started', () => r()))

    const res = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 1000 })
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message.toLowerCase()).toContain('nenhuma rodada')

    socket.disconnect()
  }, 90000)

  test('Health Check: Serviço games responde ok', async () => {
    const res = await fetch(`${API_URL}/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('games')
  }, 10000)

  test('Autenticação: Requisição sem token ou com token inválido → 401', async () => {
    const noToken = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents: 1000 })
    })
    expect(noToken.status).toBe(401)

    const badToken = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token_invalido_xpto' },
      body: JSON.stringify({ amountCents: 1000 })
    })
    expect(badToken.status).toBe(401)
  }, 10000)

  test('Validação: Aposta abaixo do mínimo (50 cents) → 400', async () => {
    const token = await getToken('player')
    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const res = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 50 })
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message.toLowerCase()).toContain('mínima')

    socket.disconnect()
  }, 90000)

  test('Validação: Aposta com valor zero ou negativo → 400', async () => {
    const token = await getToken('player')
    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const zeroRes = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 0 })
    })
    expect(zeroRes.status).toBe(400)

    const negRes = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: -500 })
    })
    expect(negRes.status).toBe(400)

    socket.disconnect()
  }, 90000)

  test('Cashout: Tentar sacar durante fase BETTING → 404', async () => {
    const token = await getToken('player')
    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const res = await fetch(`${API_URL}/bet/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ multiplier: 1.5 })
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message.toLowerCase()).toContain('nenhuma rodada ativa')

    socket.disconnect()
  }, 90000)

  test('Cashout: Tentar sacar sem ter apostado → 400', async () => {
    const token = await getToken('pedro')
    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:started', () => r()))

    const res = await fetch(`${API_URL}/bet/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ multiplier: 1.5 })
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message.toLowerCase()).toContain('aposta não encontrada')

    socket.disconnect()
  }, 90000)

  test('Cashout: Sacar duas vezes na mesma rodada → segundo cashout rejeitado', async () => {
    const token = await getToken('gabriel')
    await getBalance(token)
    await addBalance(token, 50000)

    socket = io('http://localhost:4001', { transports: ['websocket'] })
    await new Promise<void>(r => socket.once('round:betting_start', () => r()))

    const betRes = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amountCents: 1000 })
    })
    expect(betRes.status).toBe(201)

    await new Promise<void>(r => socket.once('round:started', () => r()))

    let crashed = false
    await new Promise<void>(resolve => {
      const onTick = (data: { multiplier: number }) => {
        if (data.multiplier >= 1.1) {
          socket.off('multiplier:tick', onTick)
          resolve()
        }
      }
      socket.on('multiplier:tick', onTick)
      socket.once('round:crashed', () => {
        crashed = true
        socket.off('multiplier:tick', onTick)
        resolve()
      })
    })

    if (crashed) {
      console.warn('⚠️ Crash precoce antes do cashout duplo.')
      socket.disconnect()
      return
    }

    const firstCashout = await fetch(`${API_URL}/bet/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ multiplier: 1.1 })
    })
    if (firstCashout.status === 404) {
      console.warn('⚠️ Crash precoce entre cashouts.')
      socket.disconnect()
      return
    }
    expect(firstCashout.status).toBe(201)

    const secondCashout = await fetch(`${API_URL}/bet/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ multiplier: 1.5 })
    })
    expect(secondCashout.status).toBe(400)
    const body = await secondCashout.json()
    expect(body.message.toLowerCase()).toContain('já encerrada')

    socket.disconnect()
  }, 90000)

  test('Provably Fair: Verificação criptográfica após crash', async () => {
    socket = io('http://localhost:4001', { transports: ['websocket'] })

    const crashData = await new Promise<{ roundId: string }>(r => socket.once('round:crashed', r))
    socket.disconnect()

    const res = await fetch(`${API_URL}/rounds/${crashData.roundId}/verify`)
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.data.roundId).toBe(crashData.roundId)
    expect(body.data.serverSeed).not.toBeNull()
    expect(body.data.crashPoint).not.toBeNull()
    expect(body.data.verified).toBe(true)
  }, 90000)

  test('Sincronização: duas conexões WebSocket recebem os mesmos eventos', async () => {
    const socket1 = io('http://localhost:4001', { transports: ['websocket'] })
    const socket2 = io('http://localhost:4001', { transports: ['websocket'] })

    const [betting1, betting2] = await Promise.all([
      new Promise<{ roundId: string }>(r => socket1.once('round:betting_start', r)),
      new Promise<{ roundId: string }>(r => socket2.once('round:betting_start', r))
    ])
    expect(betting1.roundId).toBe(betting2.roundId)

    const [started1, started2] = await Promise.all([
      new Promise<{ roundId: string }>(r => socket1.once('round:started', r)),
      new Promise<{ roundId: string }>(r => socket2.once('round:started', r))
    ])
    expect(started1.roundId).toBe(started2.roundId)
    expect(started1.roundId).toBe(betting1.roundId)

    const [crashed1, crashed2] = await Promise.all([
      new Promise<{ roundId: string }>(r => socket1.once('round:crashed', r)),
      new Promise<{ roundId: string }>(r => socket2.once('round:crashed', r))
    ])
    expect(crashed1.roundId).toBe(crashed2.roundId)
    expect(crashed1.roundId).toBe(started1.roundId)

    socket1.disconnect()
    socket2.disconnect()
  }, 90000)
})
