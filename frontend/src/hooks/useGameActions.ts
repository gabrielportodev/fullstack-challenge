'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { gamesApi } from '@/api/games.api'
import type { WalletStatus } from '@/stores/game.store'
import { fmtBRL, fmtMult } from '@/lib/crash-game'
import type { GameBet, GamePhase, CashoutMarker } from '@/types/crash-game'

type SetState<T> = React.Dispatch<React.SetStateAction<T>>

interface UseGameActionsParams {
  phaseRef: React.MutableRefObject<GamePhase>
  myBetRef: React.MutableRefObject<GameBet | null>
  accessToken: string | null
  walletStatus: WalletStatus
  betAmount: string
  balance: number
  username: string
  initiateLogin: () => Promise<void>
  goToWallet: () => void
  setMyBet: SetState<GameBet | null>
  setBalance: SetState<number>
  setBets: SetState<GameBet[]>
  setCashoutMarkers: SetState<CashoutMarker[]>
}

export function useGameActions({
  phaseRef,
  myBetRef,
  accessToken,
  walletStatus,
  betAmount,
  balance,
  username,
  initiateLogin,
  goToWallet,
  setMyBet,
  setBalance,
  setBets,
  setCashoutMarkers
}: UseGameActionsParams) {
  const triggerCashout = useCallback(async () => {
    const cur = myBetRef.current
    if (!cur || cur.status !== 'PENDING' || phaseRef.current !== 'ACTIVE') return
    try {
      const res = await gamesApi.cashout()
      if (res.data) {
        const mult = res.data.cashoutMultiplier!
        const payout = Number(res.data.cashoutPayoutCents!)
        setBalance(b => b + payout)
        setMyBet(prev => (prev ? { ...prev, status: 'CASHED_OUT', cashoutMultiplier: mult } : null))
        setBets(prev => prev.map(b => (b.id === cur.id ? { ...b, status: 'CASHED_OUT', cashoutMultiplier: mult } : b)))
        setCashoutMarkers(prev => [...prev, { username, mult, t: performance.now() / 1000, isMe: true }])
        toast.success(`Cash Out: ${fmtBRL(payout)} @ ${fmtMult(mult)}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao fazer cashout')
    }
  }, [myBetRef, phaseRef, username, setMyBet, setBalance, setBets, setCashoutMarkers])

  const handlePlaceBet = useCallback(async () => {
    if (!accessToken) {
      toast.info('Faça login para apostar')
      await initiateLogin()
      return
    }

    if (walletStatus === 'loading') {
      toast.info('Carregando carteira...')
      return
    }

    if (walletStatus === 'missing') {
      toast.error('Crie sua carteira antes de apostar')
      goToWallet()
      return
    }

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
      toast.error('Saldo insuficiente! Vá para a carteira para adicionar saldo.')
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
  }, [
    accessToken,
    walletStatus,
    betAmount,
    balance,
    phaseRef,
    myBetRef,
    username,
    initiateLogin,
    goToWallet,
    setMyBet,
    setBalance
  ])

  return { triggerCashout, handlePlaceBet }
}
