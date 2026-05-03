import { api } from '@/lib/api'
import type { ArrayResponseType, ResponseType } from '@crash/types'
import type {
  Bet,
  BetsResponse,
  PlaceBetRequest,
  Round,
  RoundHistoryResponse,
  VerifyRoundResponse
} from '@/types/games'

export const gamesApi = {
  getCurrentRound: () => api.get<ResponseType<Round>>('/games/rounds/current').then(r => r.data),

  getRoundHistory: (page = 1, limit = 20) =>
    api.get<ArrayResponseType<Round>>('/games/rounds/history', { params: { page, limit } }).then(r => r.data),

  verifyRound: (roundId: string) =>
    api.get<ResponseType<VerifyRoundResponse>>(`/games/rounds/${roundId}/verify`).then(r => r.data),

  getMyBets: (page = 1, limit = 20) =>
    api.get<ArrayResponseType<Bet>>('/games/bets/me', { params: { page, limit } }).then(r => r.data),

  placeBet: (payload: PlaceBetRequest) => api.post<ResponseType<Bet>>('/games/bet', payload).then(r => r.data),

  cashout: () => api.post<ResponseType<Bet>>('/games/bet/cashout').then(r => r.data)
}

export type { Round, Bet, RoundHistoryResponse, BetsResponse, VerifyRoundResponse, PlaceBetRequest }
