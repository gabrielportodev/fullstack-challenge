'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { walletsApi } from '@/api/wallets.api'
import { useGameSocket } from '@/hooks/useGameSocket'
import { useGameActions } from '@/hooks/useGameActions'
import { TopBar } from '@/components/crash-game/TopBar'
import { ControlPanel } from '@/components/crash-game/ControlPanel'
import { CrashCanvas } from '@/components/crash-game/CrashCanvas'
import { MultiplierDisplay } from '@/components/crash-game/MultiplierDisplay'
import { BetsPanel } from '@/components/crash-game/BetsPanel'
import type { GameBet, GamePhase } from '@/types/crash-game'

export default function CrashGamePage() {
  const { accessToken, user } = useAuthStore()
  const username = user?.preferred_username ?? 'Jogador'

  const [myBet, setMyBet] = useState<GameBet | null>(null)
  const [balance, setBalance] = useState(0)
  const [betAmount, setBetAmount] = useState('10')
  const [autoCashout, setAutoCashout] = useState('2.00')
  const [autoEnabled, setAutoEnabled] = useState(false)

  const myBetRef = useRef<GameBet | null>(null)
  const phaseRef = useRef<GamePhase>('BETTING')
  const multRef = useRef(1.0)
  const autoEnabledRef = useRef(false)
  const autoCashoutRef = useRef('2.00')
  const onMultiplierTickRef = useRef<(mult: number) => void>(() => {})

  useEffect(() => {
    myBetRef.current = myBet
  }, [myBet])
  useEffect(() => {
    autoEnabledRef.current = autoEnabled
  }, [autoEnabled])
  useEffect(() => {
    autoCashoutRef.current = autoCashout
  }, [autoCashout])

  useEffect(() => {
    if (!accessToken) return
    walletsApi
      .getMyWallet()
      .then(r => {
        if (r.data) setBalance(Number(r.data.balanceCents))
      })
      .catch(() => {})
  }, [accessToken])

  const {
    phase,
    multiplier,
    countdown,
    crashPoint,
    seedHash,
    bets,
    setBets,
    history,
    isConnected,
    cashoutMarkers,
    setCashoutMarkers
  } = useGameSocket({
    myBetRef,
    onMultiplierTick: onMultiplierTickRef,
    onNewRound: () => setMyBet(null),
    onMyBetLost: () => setMyBet(prev => (prev?.status === 'PENDING' ? { ...prev, status: 'LOST' } : prev)),
    onMyBetCancelled: () => setMyBet(null)
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
    betAmount,
    balance,
    username,
    setMyBet,
    setBalance,
    setBets,
    setCashoutMarkers
  })

  useEffect(() => {
    onMultiplierTickRef.current = (mult: number) => {
      if (!autoEnabledRef.current) return
      if (myBetRef.current?.status !== 'PENDING') return
      const threshold = parseFloat(autoCashoutRef.current)
      if (!isNaN(threshold) && mult >= threshold) {
        triggerCashout(mult)
      }
    }
  }, [triggerCashout])

  const canBet = phase === 'BETTING' && !myBet
  const canCashout = phase === 'ACTIVE' && myBet?.status === 'PENDING'
  const potential = canCashout ? Math.round(myBet!.amountCents * multiplier) : null
  const handleCashout = useCallback(() => triggerCashout(multRef.current), [triggerCashout])

  return (
    <div
      className='h-screen bg-zinc-950 text-zinc-100 grid grid-rows-[52px_1fr] grid-cols-[260px_1fr_280px] overflow-hidden'
      style={{ gridTemplateAreas: '"topbar topbar topbar" "left main right"' }}
    >
      <TopBar history={history} balance={balance} username={username} isConnected={isConnected} />

      <ControlPanel
        phase={phase}
        countdown={countdown}
        seedHash={seedHash}
        myBet={myBet}
        accessToken={accessToken}
        betAmount={betAmount}
        onBetAmountChange={setBetAmount}
        autoCashout={autoCashout}
        onAutoCashoutChange={setAutoCashout}
        autoEnabled={autoEnabled}
        onAutoEnabledChange={setAutoEnabled}
        multiplier={multiplier}
        potential={potential}
        canBet={canBet}
        canCashout={canCashout}
        history={history}
        onPlaceBet={handlePlaceBet}
        onCashout={handleCashout}
      />

      <main className='bg-zinc-950 flex flex-col overflow-hidden' style={{ gridArea: 'main' }}>
        <div className='flex-1 relative overflow-hidden'>
          <CrashCanvas phase={phase} multiplier={multiplier} cashoutMarkers={cashoutMarkers} />
          <MultiplierDisplay phase={phase} multiplier={multiplier} countdown={countdown} crashPoint={crashPoint} />
        </div>
      </main>

      <BetsPanel bets={bets} />
    </div>
  )
}
