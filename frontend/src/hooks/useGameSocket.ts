'use client'

import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { gamesApi } from '@/api/games.api'
import { useGameStore } from '@/stores/game.store'
import type { GameBet } from '@/types/crash-game'
import { fmtMult } from '@/lib/crash-game'
import type { SoundName } from '@/hooks/useSounds'

interface UseGameSocketOptions {
  myBetRef: React.MutableRefObject<GameBet | null>
  onMultiplierTick: React.MutableRefObject<(mult: number) => void>
  onNewRound: () => void
  onMyBetLost: () => void
  onMyBetCancelled: () => void
  onSound?: (sound: SoundName) => void
}

export function useGameSocket({
  myBetRef,
  onMultiplierTick,
  onNewRound,
  onMyBetLost,
  onMyBetCancelled,
  onSound
}: UseGameSocketOptions) {
  const phase = useGameStore(s => s.phase)
  const multiplier = useGameStore(s => s.multiplier)
  const countdown = useGameStore(s => s.countdown)
  const crashPoint = useGameStore(s => s.crashPoint)
  const seedHash = useGameStore(s => s.seedHash)
  const bets = useGameStore(s => s.bets)
  const history = useGameStore(s => s.history)
  const isConnected = useGameStore(s => s.isConnected)
  const cashoutMarkers = useGameStore(s => s.cashoutMarkers)
  const setPhase = useGameStore(s => s.setPhase)
  const setMultiplier = useGameStore(s => s.setMultiplier)
  const setCountdown = useGameStore(s => s.setCountdown)
  const setCrashPoint = useGameStore(s => s.setCrashPoint)
  const setSeedHash = useGameStore(s => s.setSeedHash)
  const setBets = useGameStore(s => s.setBets)
  const setHistory = useGameStore(s => s.setHistory)
  const setIsConnected = useGameStore(s => s.setIsConnected)
  const setCashoutMarkers = useGameStore(s => s.setCashoutMarkers)

  const onNewRoundRef = useRef(onNewRound)
  const onMyBetLostRef = useRef(onMyBetLost)
  const onMyBetCancelledRef = useRef(onMyBetCancelled)
  const onSoundRef = useRef(onSound)

  useEffect(() => {
    onNewRoundRef.current = onNewRound
  }, [onNewRound])
  useEffect(() => {
    onMyBetLostRef.current = onMyBetLost
  }, [onMyBetLost])
  useEffect(() => {
    onMyBetCancelledRef.current = onMyBetCancelled
  }, [onMyBetCancelled])
  useEffect(() => {
    onSoundRef.current = onSound
  }, [onSound])

  useEffect(() => {
    gamesApi
      .getRoundHistory(1, 20)
      .then(r => {
        if (!r.data) return
        setHistory(
          r.data.map(round => {
            const d = new Date(round.crashedAt ?? round.createdAt)
            return {
              crashPoint: round.crashPoint ?? 1,
              time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            }
          })
        )
      })
      .catch(() => {})
  }, [setHistory])

  useEffect(() => {
    const socket = io('http://localhost:4001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000
    })

    let countdownTimer: ReturnType<typeof setInterval> | null = null

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    socket.on('round:betting_start', (data: { roundId: string; seedHash: string; bettingEndsAt: number }) => {
      setPhase('BETTING')
      setMultiplier(1.0)
      setSeedHash(data.seedHash)
      setBets([])
      setCashoutMarkers([])
      setCrashPoint(null)
      onNewRoundRef.current()
      onSoundRef.current?.('bettingStart')

      if (countdownTimer) clearInterval(countdownTimer)
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((data.bettingEndsAt - Date.now()) / 1000))
        setCountdown(remaining)
        if (remaining <= 0 && countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }
      tick()
      countdownTimer = setInterval(tick, 500)
    })

    socket.on('round:started', () => {
      setPhase('ACTIVE')
      setMultiplier(1.0)
      onSoundRef.current?.('roundStart')
    })

    socket.on('multiplier:tick', (data: { multiplier: number; elapsed: number }) => {
      setMultiplier(data.multiplier)
      onMultiplierTick.current(data.multiplier)
    })

    socket.on('round:crashed', (data: { crashPoint: number; roundId: string }) => {
      setPhase('CRASHED')
      setCrashPoint(data.crashPoint)
      setMultiplier(data.crashPoint)
      setBets(prev => prev.map(b => (b.status === 'PENDING' ? { ...b, status: 'LOST' } : b)))
      onSoundRef.current?.('crash')

      if (myBetRef.current?.status === 'PENDING') {
        onMyBetLostRef.current()
        toast.error(`Crash @ ${fmtMult(data.crashPoint)} — você perdeu!`)
      }

      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      setHistory(h => [{ crashPoint: data.crashPoint, time }, ...h].slice(0, 20))
    })

    socket.on('bet:placed', (data: { playerId: string; username: string; amountCents: number; betId: string }) => {
      const username = data.username
      onSoundRef.current?.('bet')
      setBets(prev => {
        if (prev.some(b => b.id === data.betId)) return prev
        return [
          ...prev,
          {
            id: data.betId,
            username,
            amountCents: data.amountCents,
            status: 'PENDING',
            cashoutMultiplier: null,
            isNew: true
          }
        ]
      })
    })

    socket.on('bet:cashout', (data: { betId: string; multiplier: number; payoutCents: number }) => {
      onSoundRef.current?.('cashout')
      setBets(prev => {
        const updated = prev.map(b =>
          b.id === data.betId ? { ...b, status: 'CASHED_OUT' as const, cashoutMultiplier: data.multiplier } : b
        )
        const bet = updated.find(b => b.id === data.betId)
        if (bet) {
          setCashoutMarkers(m => [
            ...m,
            {
              username: bet.username,
              mult: data.multiplier,
              t: performance.now() / 1000,
              isMe: false
            }
          ])
        }
        return updated
      })
    })

    socket.on('bet:cancelled', (data: { betId: string }) => {
      setBets(prev => prev.filter(b => b.id !== data.betId))
      if (myBetRef.current?.id === data.betId) {
        onMyBetCancelledRef.current()
        toast.error('Aposta cancelada (saldo insuficiente)')
      }
    })

    return () => {
      if (countdownTimer) clearInterval(countdownTimer)
      socket.disconnect()
    }
  }, [
    myBetRef,
    onMultiplierTick,
    setBets,
    setCashoutMarkers,
    setCountdown,
    setCrashPoint,
    setHistory,
    setIsConnected,
    setMultiplier,
    setPhase,
    setSeedHash
  ])

  return {
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
  }
}
