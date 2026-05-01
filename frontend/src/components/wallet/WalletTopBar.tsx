import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { fmtBRL } from '@/lib/crash-game'
import { cn } from '@/lib/utils'
import type { Wallet } from '@/api/wallets.api'

interface WalletTopBarProps {
  username: string
  avatarLetter: string
  wallet: Wallet | null
  balanceCents: number
}

export function WalletTopBar({ username, avatarLetter, wallet, balanceCents }: WalletTopBarProps) {
  return (
    <header className='flex items-center gap-3 px-5 bg-zinc-900/95 border-b border-zinc-800 z-10 h-[52px]'>
      <Link href='/game' className='flex items-center gap-2 font-bold text-sm text-zinc-100 no-underline shrink-0'>
        <div className='w-8 h-8 rounded-lg bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base'>
          🎰
        </div>
        <span>
          Crash<span className='text-emerald-400'>Game</span>
        </span>
      </Link>

      <div className='flex-1' />

      <Link
        href='/game'
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'border-zinc-700 bg-zinc-800/90 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        )}
      >
        ← Voltar ao jogo
      </Link>

      <div className='flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 border border-zinc-700'>
        <div className='flex flex-col items-end gap-0.5'>
          <div className='text-[11px] font-bold text-emerald-400'>
            <span className='text-zinc-500 font-normal text-[10px] mr-1'>Saldo</span>
            {wallet ? fmtBRL(balanceCents) : '—'}
          </div>
          <div className='text-[11px] text-zinc-400'>{username}</div>
        </div>
        <div className='w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0'>
          {avatarLetter}
        </div>
      </div>
    </header>
  )
}
