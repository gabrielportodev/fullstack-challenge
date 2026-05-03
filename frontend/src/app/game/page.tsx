'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { fmtBRL, fmtMult } from '@/lib/crash-game'
import { useAuthStore } from '@/stores/auth.store'
import { useGameStore } from '@/stores/game.store'
import { walletsApi } from '@/api/wallets.api'
import { useGameSocket } from '@/hooks/useGameSocket'
import { useGameActions } from '@/hooks/useGameActions'
import { useSounds } from '@/hooks/useSounds'
import { TopBar } from '@/components/crash-game/TopBar'
import { ControlPanel } from '@/components/crash-game/ControlPanel'
import { CrashCanvas } from '@/components/crash-game/CrashCanvas'
import { MultiplierDisplay } from '@/components/crash-game/MultiplierDisplay'
import { BetsPanel } from '@/components/crash-game/BetsPanel'
import { BetControls } from '@/components/crash-game/BetControls'
import type { GameBet, GamePhase } from '@/types/crash-game'

export default function CrashGamePage() {
  const router = useRouter()
  const { accessToken, user, initiateLogin, logout } = useAuthStore()
  const phase = useGameStore(s => s.phase)
  const multiplier = useGameStore(s => s.multiplier)
  const countdown = useGameStore(s => s.countdown)
  const crashPoint = useGameStore(s => s.crashPoint)
  const seedHash = useGameStore(s => s.seedHash)
  const bets = useGameStore(s => s.bets)
  const history = useGameStore(s => s.history)
  const isConnected = useGameStore(s => s.isConnected)
  const cashoutMarkers = useGameStore(s => s.cashoutMarkers)
  const myBet = useGameStore(s => s.myBet)
  const balance = useGameStore(s => s.balance)
  const walletStatus = useGameStore(s => s.walletStatus)
  const setBets = useGameStore(s => s.setBets)
  const setCashoutMarkers = useGameStore(s => s.setCashoutMarkers)
  const setMyBet = useGameStore(s => s.setMyBet)
  const setBalance = useGameStore(s => s.setBalance)
  const setWalletStatus = useGameStore(s => s.setWalletStatus)
  const resetForLoggedOutUser = useGameStore(s => s.resetForLoggedOutUser)
  const username = user?.preferred_username ?? 'Visitante'

  const { play: playSound } = useSounds()
  const [betAmount, setBetAmount] = useState('10')
  const [autoCashout, setAutoCashout] = useState('')
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false)

  const myBetRef = useRef<GameBet | null>(null)
  const phaseRef = useRef<GamePhase>('BETTING')
  const multRef = useRef(1.0)
  const onMultiplierTickRef = useRef<(mult: number) => void>(() => {})
  const prevAccessTokenRef = useRef<string | null>(null)

  useEffect(() => {
    myBetRef.current = myBet
  }, [myBet])

  useEffect(() => {
    const wasLoggedOut = prevAccessTokenRef.current === null
    prevAccessTokenRef.current = accessToken

    if (!accessToken) {
      resetForLoggedOutUser()
      return
    }

    if (!wasLoggedOut) return

    setWalletStatus('loading')
    walletsApi
      .getMyWallet()
      .then(r => {
        if (!r.data) {
          setWalletStatus('missing')
          setBalance(0)
          return
        }

        setBalance(Number(r.data.balanceCents))
        setWalletStatus('ready')
      })
      .catch(err => {
        if (err?.response?.status === 404) {
          setBalance(0)
          setWalletStatus('missing')
          return
        }

        setWalletStatus('missing')
        toast.error('Não foi possível carregar sua carteira')
      })
  }, [accessToken, resetForLoggedOutUser, setBalance, setWalletStatus])

  useGameSocket({
    myBetRef,
    onMultiplierTick: onMultiplierTickRef,
    onNewRound: () => setMyBet(null),
    onMyBetLost: () => setMyBet(prev => (prev?.status === 'PENDING' ? { ...prev, status: 'LOST' } : prev)),
    onMyBetCancelled: () => {
      if (myBetRef.current) setBalance(b => b + myBetRef.current!.amountCents)
      setMyBet(null)
    },
    onMyBetAutoCashout: (mult, payoutCents) => {
      setBalance(b => b + payoutCents)
      setMyBet(prev => (prev ? { ...prev, status: 'CASHED_OUT', cashoutMultiplier: mult } : null))
      toast.success(`Auto Cashout: ${fmtBRL(payoutCents)} @ ${fmtMult(mult)}`)
    },
    onSound: playSound
  })

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    multRef.current = multiplier
  }, [multiplier])

  const { triggerCashout, handlePlaceBet } = useGameActions({
    phaseRef,
    myBetRef,
    accessToken,
    walletStatus,
    betAmount,
    autoCashout,
    autoCashoutEnabled,
    balance,
    username,
    initiateLogin,
    goToWallet: () => router.push('/wallet'),
    setMyBet,
    setBalance,
    setBets,
    setCashoutMarkers
  })

  const canBet = phase === 'BETTING' && !myBet
  const canCashout = phase === 'ACTIVE' && myBet?.status === 'PENDING'
  const potential = canCashout ? Math.round(myBet!.amountCents * multiplier) : null
  const handleCashout = useCallback(() => triggerCashout(), [triggerCashout])
  const handleWalletClick = useCallback(() => router.push('/wallet'), [router])
  const handleLoginClick = useCallback(() => {
    void initiateLogin()
  }, [initiateLogin])

  return (
    <div className='flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden desktop:grid desktop:grid-rows-[52px_1fr] desktop:grid-cols-[260px_1fr_280px]'>
      <div className='desktop:col-span-3 z-20'>
        <TopBar
          history={history}
          balance={balance}
          username={username}
          isConnected={isConnected}
          isAuthenticated={!!accessToken}
          walletStatus={walletStatus}
          onWalletClick={handleWalletClick}
          onLoginClick={handleLoginClick}
          onLogoutClick={logout}
        />
      </div>

      <div className='desktop:hidden bg-zinc-900 border-b border-zinc-800 p-2'>
        <BetControls
          phase={phase}
          myBet={myBet}
          accessToken={accessToken}
          balance={balance}
          walletStatus={walletStatus}
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          autoCashout={autoCashout}
          onAutoCashoutChange={setAutoCashout}
          autoCashoutEnabled={autoCashoutEnabled}
          onAutoCashoutEnabledChange={setAutoCashoutEnabled}
          multiplier={multiplier}
          potential={potential}
          canBet={canBet}
          canCashout={canCashout}
          onPlaceBet={handlePlaceBet}
          onCashout={handleCashout}
          compact
        />
      </div>

      <div className='hidden desktop:flex flex-col bg-zinc-900 border-r border-zinc-800 overflow-hidden'>
        <ControlPanel
          phase={phase}
          countdown={countdown}
          seedHash={seedHash}
          myBet={myBet}
          accessToken={accessToken}
          balance={balance}
          walletStatus={walletStatus}
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          autoCashout={autoCashout}
          onAutoCashoutChange={setAutoCashout}
          autoCashoutEnabled={autoCashoutEnabled}
          onAutoCashoutEnabledChange={setAutoCashoutEnabled}
          multiplier={multiplier}
          potential={potential}
          canBet={canBet}
          canCashout={canCashout}
          history={history}
          onPlaceBet={handlePlaceBet}
          onCashout={handleCashout}
        />
      </div>

      <main className='flex-1 relative bg-zinc-950 overflow-hidden min-h-[280px]'>
        <CrashCanvas phase={phase} multiplier={multiplier} cashoutMarkers={cashoutMarkers} />
        <MultiplierDisplay phase={phase} multiplier={multiplier} countdown={countdown} crashPoint={crashPoint} />
      </main>

      <div className='h-[240px] desktop:h-full bg-zinc-900 desktop:border-l border-zinc-800 overflow-hidden'>
        <BetsPanel bets={bets} />
      </div>
    </div>
  )
}
