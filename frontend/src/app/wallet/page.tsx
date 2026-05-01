'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { walletsApi, type Wallet } from '@/api/wallets.api'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' })

const fmtBRL = (cents: number) => {
  const abs = Math.abs(cents)
  return 'R$ ' + (abs / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const QUICK_VALUES = [1, 5, 10, 25, 100]

interface TxEntry {
  id: number
  type: 'credit' | 'debit'
  amountCents: number
  balanceAfter: number
  time: string
}

/* ── OPERATION CARD ── */
function OperationCard({
  type,
  balance,
  disabled,
  onProcess
}: {
  type: 'credit' | 'debit'
  balance: number
  disabled: boolean
  onProcess: (type: 'credit' | 'debit', amountCents: number, reset: () => void) => void
}) {
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isCredit = type === 'credit'
  const btnLabel = isCredit ? '✓ Depositar' : '↓ Sacar'
  const accentColor = isCredit ? '#39e87c' : '#ff4d6a'
  const accentDim = isCredit ? 'rgba(57,232,124,0.15)' : 'rgba(255,77,106,0.15)'
  const accentBorder = isCredit ? 'rgba(57,232,124,0.4)' : 'rgba(255,77,106,0.4)'

  const amountCents = Math.round(parseFloat(inputVal || '0') * 100)
  const isValid = amountCents >= 100
  const afterBalance = isCredit ? balance + amountCents : balance - amountCents
  const canDebit = !isCredit ? amountCents <= balance : true

  function handleQuick(v: number) {
    setSelectedQuick(v)
    setInputVal(String(v))
    inputRef.current?.focus()
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedQuick(null)
    setInputVal(e.target.value)
  }

  function handleClear() {
    setInputVal('')
    setSelectedQuick(null)
    inputRef.current?.focus()
  }

  function handleProcess() {
    onProcess(type, amountCents, () => {
      setInputVal('')
      setSelectedQuick(null)
    })
  }

  return (
    <div
      style={{
        background: '#0f141d',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            background: accentDim,
            flexShrink: 0
          }}
        >
          {isCredit ? '⬆️' : '⬇️'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: accentColor }}>{isCredit ? 'Crédito' : 'Débito'}</div>
          <div style={{ fontSize: 11, color: '#5d6b82' }}>
            {isCredit ? 'Adicione fundos à sua conta' : 'Retire fundos da sua conta'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Quick values */}
        <div>
          <div style={{ fontSize: 11, color: '#5d6b82', letterSpacing: '0.3px', marginBottom: 8 }}>Valores rápidos</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_VALUES.map(v => {
              const sel = selectedQuick === v
              return (
                <button
                  key={v}
                  onClick={() => handleQuick(v)}
                  style={{
                    flex: 1,
                    minWidth: 48,
                    background: sel ? accentDim : '#141b27',
                    border: `1px solid ${sel ? accentBorder : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 7,
                    padding: '8px 4px',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'var(--font-space-mono, monospace)',
                    color: sel ? accentColor : '#8fa3bd',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    textAlign: 'center'
                  }}
                >
                  R${v}
                </button>
              )
            })}
          </div>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#5d6b82', letterSpacing: '0.3px' }}>Valor personalizado</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#141b27',
              border: `1px solid ${isValid ? accentBorder : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 8,
              overflow: 'hidden',
              transition: 'border-color .15s'
            }}
          >
            <div
              style={{
                padding: '0 12px',
                color: '#5d6b82',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'var(--font-space-mono, monospace)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              R$
            </div>
            <input
              ref={inputRef}
              type='number'
              min='1'
              step='0.01'
              placeholder='0,00'
              value={inputVal}
              onChange={handleInput}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e8edf5',
                fontFamily: 'var(--font-space-mono, monospace)',
                fontSize: 16,
                fontWeight: 700,
                padding: '12px 12px'
              }}
            />
            {inputVal && (
              <button
                onClick={handleClear}
                style={{
                  padding: '0 12px',
                  color: '#5d6b82',
                  cursor: 'pointer',
                  fontSize: 16,
                  background: 'none',
                  border: 'none',
                  transition: 'color .15s'
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        {isValid && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              background: '#141b27',
              border: '1px solid rgba(255,255,255,0.07)',
              fontSize: 12
            }}
          >
            <span style={{ color: '#5d6b82' }}>Saldo após operação</span>
            <span
              style={{
                fontFamily: 'var(--font-space-mono, monospace)',
                fontWeight: 700,
                color: !isCredit && afterBalance < 0 ? '#ff4d6a' : accentColor
              }}
            >
              {fmtBRL(afterBalance)}
            </span>
          </div>
        )}

        {/* Action button */}
        <button
          disabled={!isValid || (!isCredit && !canDebit)}
          onClick={handleProcess}
          style={{
            width: '100%',
            padding: 13,
            borderRadius: 8,
            border: isCredit ? 'none' : '1px solid rgba(255,77,106,0.3)',
            fontFamily: 'var(--font-space-grotesk, sans-serif)',
            fontSize: 14,
            fontWeight: 700,
            cursor: !isValid || (!isCredit && !canDebit) ? 'not-allowed' : 'pointer',
            transition: 'all .15s',
            letterSpacing: '0.3px',
            opacity: !isValid || (!isCredit && !canDebit) ? 0.35 : 1,
            background: isCredit ? '#39e87c' : 'rgba(255,77,106,0.15)',
            color: isCredit ? '#050a0e' : '#ff4d6a'
          }}
        >
          {!isValid
            ? 'Insira um valor'
            : !canDebit && !isCredit
              ? 'Saldo insuficiente'
              : `${btnLabel} ${fmtBRL(amountCents)}`}
        </button>
      </div>
    </div>
  )
}

/* ── MAIN PAGE ── */
export default function WalletPage() {
  const { accessToken, isLoading, initiateLogin, user } = useAuthStore()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isWalletLoading, setIsWalletLoading] = useState(true)
  const [walletLoadError, setWalletLoadError] = useState(false)
  const [txHistory, setTxHistory] = useState<TxEntry[]>([])

  const username = user?.preferred_username ?? 'Jogador'
  const avatarLetter = username.charAt(0).toUpperCase()
  const balanceCents = wallet ? Number(wallet.balanceCents) : 0

  const totalIn = txHistory.filter(t => t.type === 'credit').reduce((s, t) => s + t.amountCents, 0)
  const totalOut = txHistory.filter(t => t.type === 'debit').reduce((s, t) => s + t.amountCents, 0)

  const loadWallet = useCallback(async () => {
    if (!accessToken) {
      setWallet(null)
      setWalletLoadError(false)
      setIsWalletLoading(false)
      return
    }
    setIsWalletLoading(true)
    setWalletLoadError(false)
    try {
      const res = await walletsApi.getMyWallet()
      setWallet(res.data ?? null)
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        setWallet(null)
      } else {
        setWalletLoadError(true)
        toast.error('Não foi possível carregar a carteira')
      }
    } finally {
      setIsWalletLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      if (mounted) await loadWallet()
    }
    void fetch()
    return () => {
      mounted = false
    }
  }, [loadWallet])

  async function handleCreateWallet() {
    try {
      const res = await walletsApi.createWallet()
      setWallet(res.data ?? null)
      toast.success('Carteira criada com sucesso!')
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        await loadWallet()
        return
      }
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Não foi possível criar a carteira')
    }
  }

  async function handleProcess(type: 'credit' | 'debit', amountCents: number, reset: () => void) {
    if (!wallet) {
      toast.error('Crie a carteira antes de movimentar saldo')
      return
    }

    try {
      const res =
        type === 'credit' ? await walletsApi.creditWallet(amountCents) : await walletsApi.debitWallet(amountCents)

      const updated = res.data ?? null
      setWallet(updated)

      const balanceAfter = updated ? Number(updated.balanceCents) : balanceCents
      setTxHistory(prev => [{ id: Date.now(), type, amountCents, balanceAfter, time: fmtTime() }, ...prev].slice(0, 20))

      toast.success(type === 'credit' ? 'Depósito realizado!' : 'Saque processado!')
      reset()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Não foi possível processar a operação')
    }
  }

  /* ── Loading ── */
  if (isLoading || isWalletLoading) {
    return (
      <div
        className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080b10'
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '3px solid #1a2236',
            borderTopColor: '#39e87c',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  /* ── Unauthenticated ── */
  if (!accessToken) {
    return (
      <div
        className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080b10',
          padding: 24,
          fontFamily: 'var(--font-space-grotesk, sans-serif)'
        }}
      >
        <div
          style={{
            background: '#0f141d',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '32px 28px',
            maxWidth: 380,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #39e87c 0%, #1ab858 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}
            >
              🎰
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#e8edf5', letterSpacing: -0.3 }}>
              Crash<span style={{ color: '#39e87c' }}>Game</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8edf5', marginBottom: 6 }}>Carteira</div>
            <div style={{ fontSize: 13, color: '#5d6b82', lineHeight: 1.5 }}>
              Entre na sua conta para criar a carteira e ajustar saldo de teste.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => void initiateLogin()}
              style={{
                flex: 1,
                padding: '11px 0',
                background: '#39e87c',
                color: '#050a0e',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'var(--font-space-grotesk, sans-serif)'
              }}
            >
              Entrar
            </button>
            <Link
              href='/game'
              style={{
                flex: 1,
                padding: '11px 0',
                background: '#141b27',
                color: '#8fa3bd',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Voltar ao jogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Main UI ── */
  return (
    <div
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
      style={{
        display: 'grid',
        minHeight: '100vh',
        gridTemplateRows: '52px 1fr',
        background: '#080b10',
        color: '#e8edf5',
        fontFamily: 'var(--font-space-grotesk, sans-serif)'
      }}
    >
      {/* ── TOPBAR ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 20px',
          background: '#0f141d',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          zIndex: 10
        }}
      >
        <Link
          href='/game'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: -0.3,
            textDecoration: 'none',
            color: '#e8edf5'
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #39e87c 0%, #1ab858 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16
            }}
          >
            🎰
          </div>
          <span>
            Crash<span style={{ color: '#39e87c' }}>Game</span>
          </span>
        </Link>

        <div style={{ flex: 1 }} />

        <Link
          href='/game'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#141b27',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: '#8fa3bd',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all .15s'
          }}
        >
          ← Voltar ao jogo
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '5px 12px',
            borderRadius: 10,
            background: '#141b27',
            border: '1px solid rgba(255,255,255,0.07)',
            marginLeft: 10
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#39e87c' }}>
              <span style={{ color: '#8fa3bd', fontWeight: 400, fontSize: 11, marginRight: 4 }}>Saldo</span>
              {wallet ? fmtBRL(balanceCents) : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#8fa3bd' }}>{username}</div>
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            {avatarLetter}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main
        style={{
          overflowY: 'auto',
          padding: '32px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 860,
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          {/* ── BALANCE CARD ── */}
          <div
            style={{
              background: '#0f141d',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '28px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at 10% 50%, rgba(57,232,124,0.06) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#5d6b82'
                }}
              >
                Saldo disponível
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-space-mono, monospace)',
                  fontSize: 42,
                  fontWeight: 700,
                  color: wallet ? '#39e87c' : '#5d6b82',
                  textShadow: wallet ? '0 0 40px rgba(57,232,124,0.35)' : 'none',
                  letterSpacing: -1,
                  lineHeight: 1
                }}
              >
                {wallet ? (
                  <>
                    <span
                      style={{
                        fontFamily: 'var(--font-space-mono, monospace)',
                        fontSize: 18,
                        color: '#8fa3bd',
                        marginRight: 8
                      }}
                    >
                      R$
                    </span>
                    {(balanceCents / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </>
                ) : walletLoadError ? (
                  'Erro'
                ) : (
                  'Sem carteira'
                )}
              </div>
              <div style={{ fontSize: 12, color: '#5d6b82', marginTop: 4 }}>
                {wallet
                  ? 'Atualizado agora • Conta verificada'
                  : walletLoadError
                    ? 'Falha ao carregar'
                    : 'Crie sua carteira para começar'}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 10,
                position: 'relative'
              }}
            >
              {wallet ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 99,
                      background: 'rgba(57,232,124,0.15)',
                      border: '1px solid rgba(57,232,124,0.25)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#39e87c',
                      letterSpacing: '0.5px'
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#39e87c',
                        animation: 'pulse-dot 1.4s ease-in-out infinite'
                      }}
                    />
                    Conta ativa
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8edf5' }}>
                    {username}
                    <span style={{ color: '#5d6b82', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>jogador</span>
                  </div>
                </>
              ) : walletLoadError ? (
                <button
                  onClick={() => void loadWallet()}
                  style={{
                    padding: '8px 18px',
                    background: '#141b27',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    color: '#8fa3bd',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-space-grotesk, sans-serif)'
                  }}
                >
                  Tentar novamente
                </button>
              ) : (
                <button
                  onClick={() => void handleCreateWallet()}
                  style={{
                    padding: '10px 22px',
                    background: '#39e87c',
                    border: 'none',
                    borderRadius: 8,
                    color: '#050a0e',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-space-grotesk, sans-serif)'
                  }}
                >
                  Criar carteira
                </button>
              )}
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12
            }}
          >
            {[
              {
                label: 'Total depositado',
                value: fmtBRL(totalIn),
                color: totalIn > 0 ? '#39e87c' : '#e8edf5',
                sub: `${txHistory.filter(t => t.type === 'credit').length} transações`
              },
              {
                label: 'Total sacado',
                value: fmtBRL(totalOut),
                color: totalOut > 0 ? '#ff4d6a' : '#e8edf5',
                sub: `${txHistory.filter(t => t.type === 'debit').length} transações`
              },
              {
                label: 'Operações hoje',
                value: String(txHistory.length),
                color: '#e8edf5',
                sub: 'na sessão atual'
              }
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: '#0f141d',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    color: '#5d6b82'
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-space-mono, monospace)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: stat.color
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#5d6b82', marginTop: 2 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* ── PANELS ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className='wallet-panels'>
            <OperationCard type='credit' balance={balanceCents} disabled={!wallet} onProcess={handleProcess} />
            <OperationCard type='debit' balance={balanceCents} disabled={!wallet} onProcess={handleProcess} />
          </div>

          {/* ── TRANSACTION HISTORY ── */}
          <div
            style={{
              background: '#0f141d',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8edf5' }}>Histórico de transações</div>
              {txHistory.length > 0 && (
                <button
                  onClick={() => setTxHistory([])}
                  style={{
                    fontSize: 11,
                    color: '#5d6b82',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    transition: 'color .15s',
                    fontFamily: 'var(--font-space-grotesk, sans-serif)'
                  }}
                >
                  Limpar histórico
                </button>
              )}
            </div>

            {txHistory.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#5d6b82',
                  fontSize: 13
                }}
              >
                Nenhuma transação ainda — realize um depósito ou saque acima.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {txHistory.map(tx => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      transition: 'background .12s'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                        background: tx.type === 'credit' ? 'rgba(57,232,124,0.15)' : 'rgba(255,77,106,0.15)'
                      }}
                    >
                      {tx.type === 'credit' ? '⬆️' : '⬇️'}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8edf5' }}>
                        {tx.type === 'credit' ? 'Depósito' : 'Saque'}
                      </div>
                      <div style={{ fontSize: 11, color: '#5d6b82' }}>{tx.time}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-space-mono, monospace)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: tx.type === 'credit' ? '#39e87c' : '#ff4d6a'
                        }}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {fmtBRL(tx.amountCents)}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-space-mono, monospace)',
                          fontSize: 11,
                          color: '#5d6b82'
                        }}
                      >
                        saldo: {fmtBRL(tx.balanceAfter)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 720px) {
          .wallet-panels { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
