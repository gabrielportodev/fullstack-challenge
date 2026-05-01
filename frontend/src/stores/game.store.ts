'use client'

import { create } from 'zustand'
import type { CashoutMarker, GameBet, GamePhase, HistoryEntry } from '@/types/crash-game'

type Updater<T> = T | ((prev: T) => T)

export type WalletStatus = 'loading' | 'ready' | 'missing'

interface GameStoreState {
  phase: GamePhase
  multiplier: number
  countdown: number
  crashPoint: number | null
  seedHash: string
  bets: GameBet[]
  history: HistoryEntry[]
  isConnected: boolean
  cashoutMarkers: CashoutMarker[]
  myBet: GameBet | null
  balance: number
  walletStatus: WalletStatus
  setPhase: (phase: GamePhase) => void
  setMultiplier: (multiplier: number) => void
  setCountdown: (countdown: number) => void
  setCrashPoint: (crashPoint: number | null) => void
  setSeedHash: (seedHash: string) => void
  setBets: (updater: Updater<GameBet[]>) => void
  setHistory: (updater: Updater<HistoryEntry[]>) => void
  setIsConnected: (connected: boolean) => void
  setCashoutMarkers: (updater: Updater<CashoutMarker[]>) => void
  setMyBet: (updater: Updater<GameBet | null>) => void
  setBalance: (updater: Updater<number>) => void
  setWalletStatus: (status: WalletStatus) => void
  resetForLoggedOutUser: () => void
}

function resolveUpdater<T>(prev: T, updater: Updater<T>): T {
  return typeof updater === 'function' ? (updater as (value: T) => T)(prev) : updater
}

export const useGameStore = create<GameStoreState>(set => ({
  phase: 'BETTING',
  multiplier: 1,
  countdown: 10,
  crashPoint: null,
  seedHash: '',
  bets: [],
  history: [],
  isConnected: false,
  cashoutMarkers: [],
  myBet: null,
  balance: 0,
  walletStatus: 'missing',
  setPhase: phase => set({ phase }),
  setMultiplier: multiplier => set({ multiplier }),
  setCountdown: countdown => set({ countdown }),
  setCrashPoint: crashPoint => set({ crashPoint }),
  setSeedHash: seedHash => set({ seedHash }),
  setBets: updater => set(state => ({ bets: resolveUpdater(state.bets, updater) })),
  setHistory: updater => set(state => ({ history: resolveUpdater(state.history, updater) })),
  setIsConnected: isConnected => set({ isConnected }),
  setCashoutMarkers: updater => set(state => ({ cashoutMarkers: resolveUpdater(state.cashoutMarkers, updater) })),
  setMyBet: updater => set(state => ({ myBet: resolveUpdater(state.myBet, updater) })),
  setBalance: updater => set(state => ({ balance: resolveUpdater(state.balance, updater) })),
  setWalletStatus: walletStatus => set({ walletStatus }),
  resetForLoggedOutUser: () =>
    set({
      myBet: null,
      balance: 0,
      walletStatus: 'missing'
    })
}))
