import { api } from '@/lib/api'
import type { ResponseType } from '@crash/types'
import type { Wallet } from '@/types/wallets'

export const walletsApi = {
  getMyWallet: () => api.get<ResponseType<Wallet>>('/wallets/me').then(r => r.data),

  createWallet: () => api.post<ResponseType<Wallet>>('/wallets').then(r => r.data),

  creditWallet: (amountCents: number) =>
    api.post<ResponseType<Wallet>>('/wallets/credit', { amountCents }).then(r => r.data),

  debitWallet: (amountCents: number) =>
    api.post<ResponseType<Wallet>>('/wallets/debit', { amountCents }).then(r => r.data)
}

export type { Wallet }
