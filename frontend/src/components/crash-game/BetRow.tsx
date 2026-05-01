import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { fmtBRL, avatarColor } from '@/lib/crash-game'
import type { GameBet } from '@/types/crash-game'

interface BetRowProps {
  bet: GameBet
}

export function BetRow({ bet }: BetRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
        bet.status === 'CASHED_OUT' && 'bg-emerald-950/30 border-emerald-500/20',
        bet.status === 'LOST' && 'bg-zinc-900/30 border-zinc-800/50 opacity-45',
        bet.status === 'PENDING' && 'bg-zinc-900 border-zinc-800',
        bet.isNew && 'animate-in slide-in-from-top-2 duration-300'
      )}
    >
      <div
        className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0'
        style={{ background: avatarColor(bet.username) }}
      >
        {bet.username[0].toUpperCase()}
      </div>

      <span className='flex-1 text-zinc-200 font-medium truncate'>{bet.username}</span>

      <div className='flex flex-col items-end gap-0.5'>
        <span className='font-mono text-[11px] text-zinc-400'>{fmtBRL(bet.amountCents)}</span>
        {bet.status === 'CASHED_OUT' && (
          <Badge
            variant='outline'
            className='text-[10px] h-4 px-1.5 font-mono bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
          >
            {bet.cashoutMultiplier?.toFixed(2)}x
          </Badge>
        )}
        {bet.status === 'LOST' && (
          <Badge
            variant='outline'
            className='text-[10px] h-4 px-1.5 font-mono bg-red-950/50 text-red-400 border-red-500/30'
          >
            BUST
          </Badge>
        )}
        {bet.status === 'PENDING' && (
          <Badge
            variant='outline'
            className='text-[10px] h-4 px-1.5 font-mono bg-amber-950/30 text-amber-400 border-amber-500/20'
          >
            ...
          </Badge>
        )}
      </div>
    </div>
  )
}
