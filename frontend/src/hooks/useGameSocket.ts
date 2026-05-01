'use client'

import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { gamesApi } from '@/api/games.api'
import type { GameBet, HistoryEntry, CashoutMarker, GamePhase } from '@/types/crash-game'
import { fmtMult } from '@/lib/crash-game'
import type { Round } from '@/types/games'

interface UseGameSocketOptions {
  myBetRef: React.MutableRefObject<GameBet | null>
  onMultiplierTick: React.MutableRefObject<(mult: number) => void>
  onNewRound: () => void
  onMyBetLost: () => void
  onMyBetCancelled: () => void
}

export function useGameSocket({
  myBetRef,
  onMultiplierTick,
  onNewRound,
  onMyBetLost,
  onMyBetCancelled
}: UseGameSocketOptions) {
  const [phase, setPhase] = useState<GamePhase>('BETTING')
  const [multiplier, setMultiplier] = useState(1.0)
  const [countdown, setCountdown] = useState(10)
  const [crashPoint, setCrashPoint] = useState<number | null>(null)
  const [seedHash, setSeedHash] = useState('')
  const [bets, setBets] = useState<GameBet[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [cashoutMarkers, setCashoutMarkers] = useState<CashoutMarker[]>([])

  const onNewRoundRef = useRef(onNewRound)
  const onMyBetLostRef = useRef(onMyBetLost)
  const onMyBetCancelledRef = useRef(onMyBetCancelled)
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
    gamesApi
      .getRoundHistory(1, 20)
      .then(r => {
        if (!r.data) return
        setHistory(
          r.data
            .filter(round => round.status === 'CRASHED')
            .map(round => {
              const d = new Date(round.crashedAt ?? round.createdAt)
              return {
                crashPoint: (round as Round & { crashPoint?: number }).crashPoint ?? 1,
                time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              }
            })
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const socket = io('http://localhost:4001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000
    })

    let countdownTimer: ReturnType<typeof setInterval> | null = null

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    socket.on('round:betting_start', (data: { roundId: string; seedHash: string; duration: number }) => {
      setPhase('BETTING')
      setMultiplier(1.0)
      setSeedHash(data.seedHash)
      setBets([])
      setCashoutMarkers([])
      setCrashPoint(null)
      onNewRoundRef.current()

      if (countdownTimer) clearInterval(countdownTimer)
      let c = Math.ceil(data.duration / 1000)
      setCountdown(c)
      countdownTimer = setInterval(() => {
        c--
        setCountdown(Math.max(0, c))
        if (c <= 0 && countdownTimer) clearInterval(countdownTimer)
      }, 1000)
    })

    socket.on('round:started', () => {
      setPhase('ACTIVE')
      setMultiplier(1.0)
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

      if (myBetRef.current?.status === 'PENDING') {
        onMyBetLostRef.current()
        toast.error(`Crash @ ${fmtMult(data.crashPoint)} — você perdeu!`)
      }

      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      setHistory(h => [{ crashPoint: data.crashPoint, time }, ...h].slice(0, 20))
    })

    socket.on('bet:placed', (data: { playerId: string; username?: string; amountCents: number; betId: string }) => {
      const username = data.username ?? `Player_${data.playerId.slice(0, 6)}`
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
  }, [myBetRef, onMultiplierTick])

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
