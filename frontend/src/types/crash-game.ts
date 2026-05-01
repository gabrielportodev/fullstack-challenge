export interface GameBet {
  id: string
  username: string
  amountCents: number
  status: 'PENDING' | 'CASHED_OUT' | 'LOST'
  cashoutMultiplier: number | null
  isNew?: boolean
}

export interface HistoryEntry {
  crashPoint: number
  time: string
}

export interface CashoutMarker {
  username: string
  mult: number
  t: number
  isMe: boolean
}

export type GamePhase = 'BETTING' | 'ACTIVE' | 'CRASHED'
