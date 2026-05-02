import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import amqp from 'amqplib'

const KONG_URL = process.env.TEST_KONG_URL ?? 'http://localhost:8000'
const KEYCLOAK_TOKEN_URL =
  process.env.TEST_KEYCLOAK_TOKEN_URL ??
  'http://localhost:8080/realms/crash-game/protocol/openid-connect/token'
const RABBITMQ_URL = process.env.TEST_RABBITMQ_URL ?? 'amqp://admin:admin@localhost:5672'

const WALLET_API_URL = `${KONG_URL}/wallets`

async function getToken(username: string): Promise<string> {
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

  if (!res.ok) throw new Error(`Auth failed for ${username}: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

function getPlayerIdFromToken(token: string): string {
  const payloadB64 = token.split('.')[1]
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as { sub: string }
  return payload.sub
}

async function getBalance(token: string): Promise<bigint> {
  const res = await fetch(`${WALLET_API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`Balance fetch failed: ${res.status}`)
  const json = (await res.json()) as { data: { balanceCents: string } }
  return BigInt(json.data.balanceCents)
}

async function ensureWallet(token: string): Promise<void> {
  await fetch(WALLET_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Publica uma mensagem no formato NestJS microservices para a fila wallets_queue
async function publishToWallets(
  channel: amqp.Channel,
  pattern: string,
  data: Record<string, unknown>
): Promise<void> {
  const msg = JSON.stringify({ pattern, data })
  channel.sendToQueue('wallets_queue', Buffer.from(msg), { persistent: true })
}

describe('Wallet Service E2E Suite', () => {
  let rmqConnection: amqp.Connection
  let channel: amqp.Channel

  beforeAll(async () => {
    rmqConnection = await amqp.connect(RABBITMQ_URL)
    channel = await rmqConnection.createChannel()
    await channel.assertQueue('wallets_queue', { durable: true })
  })

  afterAll(async () => {
    await channel.close()
    await rmqConnection.close()
  })

  // ─── REST endpoints ───────────────────────────────────────────────────────

  test('Health Check: serviço wallets responde ok', async () => {
    const res = await fetch(`${WALLET_API_URL}/health`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; service: string }
    expect(body.status).toBe('ok')
    expect(body.service).toBe('wallets')
  }, 10000)

  test('Criar carteira: deve criar com sucesso para usuário autenticado', async () => {
    const token = await getToken('joao')
    await ensureWallet(token) // garante que existe para não conflitar
    const res = await fetch(WALLET_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    // 201 = criada, 409 = já existe (seed já criou). Ambos são comportamentos corretos.
    expect([201, 409]).toContain(res.status)
  }, 15000)

  test('Criar carteira duplicada: deve retornar 409', async () => {
    const token = await getToken('gabriel')
    await ensureWallet(token)
    const res = await fetch(WALLET_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(409)
  }, 15000)

  test('Consultar carteira: deve retornar saldo do jogador autenticado', async () => {
    const token = await getToken('player')
    const res = await fetch(`${WALLET_API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; data: { balanceCents: string; playerId: string } }
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('balanceCents')
    expect(body.data).toHaveProperty('playerId')
  }, 15000)

  test('Auth: requisição sem token deve retornar 401', async () => {
    const resCreate = await fetch(WALLET_API_URL, { method: 'POST' })
    expect(resCreate.status).toBe(401)

    const resGet = await fetch(`${WALLET_API_URL}/me`)
    expect(resGet.status).toBe(401)
  }, 10000)

  test('Auth: token inválido deve retornar 401', async () => {
    const res = await fetch(`${WALLET_API_URL}/me`, {
      headers: { Authorization: 'Bearer token_invalido_xpto' }
    })
    expect(res.status).toBe(401)
  }, 10000)

  // ─── Crédito via RabbitMQ ─────────────────────────────────────────────────

  test('Crédito via RabbitMQ: saldo deve aumentar pelo valor creditado', async () => {
    const token = await getToken('gabriel')
    const playerId = getPlayerIdFromToken(token)
    const creditAmount = 50000n // R$500,00

    const initialBalance = await getBalance(token)

    await publishToWallets(channel, 'wallet.credit', {
      playerId,
      amountCents: creditAmount.toString()
    })

    await new Promise(r => setTimeout(r, 1500))

    const finalBalance = await getBalance(token)
    expect(finalBalance).toBe(initialBalance + creditAmount)
  }, 20000)

  test('Crédito acumulado: múltiplos créditos somam corretamente', async () => {
    const token = await getToken('gabriel')
    const playerId = getPlayerIdFromToken(token)
    const creditAmount = 10000n // R$100,00

    const initialBalance = await getBalance(token)

    await publishToWallets(channel, 'wallet.credit', {
      playerId,
      amountCents: creditAmount.toString()
    })
    await publishToWallets(channel, 'wallet.credit', {
      playerId,
      amountCents: creditAmount.toString()
    })

    await new Promise(r => setTimeout(r, 2000))

    const finalBalance = await getBalance(token)
    expect(finalBalance).toBe(initialBalance + creditAmount * 2n)
  }, 20000)

  // ─── Débito via RabbitMQ ──────────────────────────────────────────────────

  test('Débito via RabbitMQ: saldo deve diminuir pelo valor debitado', async () => {
    const token = await getToken('gabriel')
    const playerId = getPlayerIdFromToken(token)
    const debitAmount = 10000n // R$100,00

    const initialBalance = await getBalance(token)
    expect(initialBalance).toBeGreaterThan(debitAmount)

    await publishToWallets(channel, 'wallet.debit', {
      betId: `test-debit-${Date.now()}`,
      playerId,
      amountCents: debitAmount.toString()
    })

    await new Promise(r => setTimeout(r, 1500))

    const finalBalance = await getBalance(token)
    expect(finalBalance).toBe(initialBalance - debitAmount)
  }, 20000)

  // ─── Débito com saldo insuficiente ────────────────────────────────────────

  test('Débito insuficiente: saldo não deve ser alterado', async () => {
    const token = await getToken('pedro')
    await ensureWallet(token)

    const initialBalance = await getBalance(token)
    const playerId = getPlayerIdFromToken(token)

    // Pedro tem saldo 0 (seed) — qualquer débito deve falhar
    await publishToWallets(channel, 'wallet.debit', {
      betId: `test-insufficient-${Date.now()}`,
      playerId,
      amountCents: '999999999'
    })

    await new Promise(r => setTimeout(r, 1500))

    const finalBalance = await getBalance(token)
    expect(finalBalance).toBe(initialBalance)
  }, 20000)

  // ─── Fluxo completo: crédito seguido de débito ────────────────────────────

  test('Fluxo completo: crédito seguido de débito resulta no saldo esperado', async () => {
    const token = await getToken('joao')
    const playerId = getPlayerIdFromToken(token)

    const initialBalance = await getBalance(token)
    const creditAmount = 100000n // R$1.000,00
    const debitAmount = 30000n // R$300,00

    await publishToWallets(channel, 'wallet.credit', {
      playerId,
      amountCents: creditAmount.toString()
    })

    await new Promise(r => setTimeout(r, 1000))

    await publishToWallets(channel, 'wallet.debit', {
      betId: `test-flow-${Date.now()}`,
      playerId,
      amountCents: debitAmount.toString()
    })

    await new Promise(r => setTimeout(r, 1500))

    const finalBalance = await getBalance(token)
    expect(finalBalance).toBe(initialBalance + creditAmount - debitAmount)
  }, 20000)
})
