'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { walletsApi, type Wallet } from '@/api/wallets.api'
import { WalletTopBar } from '@/components/wallet/WalletTopBar'
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard'

export default function WalletPage() {
  const { accessToken, isLoading, initiateLogin, user } = useAuthStore()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isWalletLoading, setIsWalletLoading] = useState(true)
  const [walletLoadError, setWalletLoadError] = useState(false)

  const username = user?.preferred_username ?? 'Jogador'
  const avatarLetter = username.charAt(0).toUpperCase()
  const balanceCents = wallet ? Number(wallet.balanceCents) : 0

  const loadWallet = useCallback(async () => {
    if (!accessToken) {
      setWallet(null)
      setWalletLoadError(false)
      setIsWalletLoading(false)
      return
    }
    setIsWalletLoading(true)
    setWalletLoadError(false)
    try {
      const res = await walletsApi.getMyWallet()
      setWallet(res.data ?? null)
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        setWallet(null)
      } else {
        setWalletLoadError(true)
        toast.error('Não foi possível carregar a carteira')
      }
    } finally {
      setIsWalletLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      if (mounted) await loadWallet()
    }
    void fetch()
    return () => {
      mounted = false
    }
  }, [loadWallet])

  async function handleCreateWallet() {
    try {
      const res = await walletsApi.createWallet()
      setWallet(res.data ?? null)
      toast.success('Carteira criada com sucesso!')
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        await loadWallet()
        return
      }
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Não foi possível criar a carteira')
    }
  }

  if (isLoading || isWalletLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <div className='h-8 w-8 rounded-full border-4 border-zinc-800 border-t-emerald-500 animate-spin' />
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950 p-6'>
        <div className='bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full flex flex-col gap-5'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl'>
              🎰
            </div>
            <span className='font-bold text-lg text-zinc-100'>
              Crash<span className='text-emerald-400'>Game</span>
            </span>
          </div>
          <div>
            <p className='text-lg font-bold text-zinc-100 mb-1.5'>Carteira</p>
            <p className='text-sm text-zinc-500 leading-relaxed'>
              Entre na sua conta para visualizar o saldo da sua carteira.
            </p>
          </div>
          <div className='flex gap-2.5'>
            <Button
              onClick={() => void initiateLogin()}
              className='flex-1 bg-emerald-500 text-zinc-900 font-bold hover:bg-emerald-400'
            >
              Entrar
            </Button>
            <Link
              href='/game'
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'flex-1 border-zinc-700 bg-zinc-800/90 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              Voltar ao jogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='grid min-h-screen grid-rows-[52px_1fr] bg-zinc-950 text-zinc-100'>
      <WalletTopBar username={username} avatarLetter={avatarLetter} wallet={wallet} balanceCents={balanceCents} />

      <main className='overflow-y-auto py-8 px-5'>
        <div className='mx-auto max-w-3xl flex flex-col gap-5'>
          <WalletBalanceCard
            wallet={wallet}
            walletLoadError={walletLoadError}
            balanceCents={balanceCents}
            username={username}
            onCreateWallet={() => void handleCreateWallet()}
            onRetry={() => void loadWallet()}
          />

          <div className='bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5'>
            <p className='text-sm font-semibold text-zinc-100 mb-1.5'>Como funciona o saldo?</p>
            <p className='text-sm text-zinc-500 leading-relaxed'>
              O saldo é debitado automaticamente ao fazer uma aposta e creditado ao realizar o cash out. Todas as
              movimentações acontecem em tempo real durante as rodadas do jogo.
            </p>
            <Link
              href='/game'
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'mt-4 border-zinc-700 bg-zinc-800/90 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              Ir para o jogo
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
