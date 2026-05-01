'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { gamesApi } from '@/api/games.api'
import { fmtBRL, fmtMult } from '@/lib/crash-game'
import type { GameBet, GamePhase, CashoutMarker } from '@/types/crash-game'

type SetState<T> = React.Dispatch<React.SetStateAction<T>>

interface UseGameActionsParams {
  phaseRef: React.MutableRefObject<GamePhase>
  myBetRef: React.MutableRefObject<GameBet | null>
  betAmount: string
  balance: number
  username: string
  setMyBet: SetState<GameBet | null>
  setBalance: SetState<number>
  setBets: SetState<GameBet[]>
  setCashoutMarkers: SetState<CashoutMarker[]>
}

export function useGameActions({
  phaseRef,
  myBetRef,
  betAmount,
  balance,
  username,
  setMyBet,
  setBalance,
  setBets,
  setCashoutMarkers
}: UseGameActionsParams) {
  const triggerCashout = useCallback(
    async (mult: number) => {
      const cur = myBetRef.current
      if (!cur || cur.status !== 'PENDING' || phaseRef.current !== 'ACTIVE') return
      try {
        const res = await gamesApi.cashout(mult)
        if (res.data) {
          const payout = Math.round(cur.amountCents * mult)
          setBalance(b => b + payout)
          setMyBet(prev => (prev ? { ...prev, status: 'CASHED_OUT', cashoutMultiplier: mult } : null))
          setBets(prev =>
            prev.map(b => (b.id === cur.id ? { ...b, status: 'CASHED_OUT', cashoutMultiplier: mult } : b))
          )
          setCashoutMarkers(prev => [...prev, { username, mult, t: performance.now() / 1000, isMe: true }])
          toast.success(`Cash Out: ${fmtBRL(Math.round(cur.amountCents * mult))} @ ${fmtMult(mult)}`)
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(msg ?? 'Erro ao fazer cashout')
      }
    },
    [myBetRef, phaseRef, username, setMyBet, setBalance, setBets, setCashoutMarkers]
  )

  const handlePlaceBet = useCallback(async () => {
    const cents = Math.round(parseFloat(betAmount) * 100)
    if (isNaN(cents) || cents < 100) {
      toast.error('Aposta mínima: R$ 1,00')
      return
    }
    if (cents > 100_000) {
      toast.error('Aposta máxima: R$ 1.000,00')
      return
    }
    if (cents > balance) {
      toast.error('Saldo insuficiente!')
      return
    }
    if (phaseRef.current !== 'BETTING') {
      toast.error('Fase de apostas encerrada!')
      return
    }
    if (myBetRef.current) {
      toast.error('Você já apostou nesta rodada!')
      return
    }

    try {
      const res = await gamesApi.placeBet(cents)
      if (res.data) {
        const bet: GameBet = {
          id: res.data.id,
          username,
          amountCents: cents,
          status: 'PENDING',
          cashoutMultiplier: null,
          isNew: true
        }
        setMyBet(bet)
        setBalance(b => b - cents)
        toast.success(`Aposta de ${fmtBRL(cents)} confirmada!`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao apostar')
    }
  }, [betAmount, balance, phaseRef, myBetRef, username, setMyBet, setBalance])

  return { triggerCashout, handlePlaceBet }
}
