import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { fmtBRL, avatarColor } from '@/lib/crash-game'
import type { GameBet } from '@/types/crash-game'

interface BetRowProps {
  bet: GameBet
}

export function BetRow({ bet }: BetRowProps) {
  const isCashedOut = bet.status === 'CASHED_OUT'
  const isLost = bet.status === 'LOST'
  const isPending = bet.status === 'PENDING'

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-500',
        isCashedOut && 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
        isLost && 'bg-zinc-900/30 border-zinc-800/50 opacity-40 grayscale-[0.5]',
        isPending && 'bg-zinc-900/50 border-zinc-800',
        bet.isNew && 'animate-in slide-in-from-top-2 duration-300'
      )}
    >
      <div
        className='w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm'
        style={{ background: avatarColor(bet.username) }}
      >
        {bet.username[0].toUpperCase()}
      </div>

      <div className='flex flex-col min-w-0 flex-1'>
        <span className='text-zinc-100 font-bold truncate text-[12px]'>{bet.username}</span>
        <span className='font-mono text-[10px] text-zinc-500 uppercase tracking-tighter'>
          Aposta: {fmtBRL(bet.amountCents)}
        </span>
      </div>

      <div className='flex flex-col items-end gap-1'>
        {isCashedOut ? (
          <>
            <span className='font-black text-[12px] text-emerald-400 animate-in zoom-in-50 duration-300'>
              +{fmtBRL(Math.round(bet.amountCents * (bet.cashoutMultiplier || 1)))}
            </span>
            <Badge
              variant='outline'
              className='text-[9px] h-4 px-1.5 font-black bg-emerald-500/20 text-emerald-400 border-emerald-500/40 uppercase tracking-widest'
            >
              {bet.cashoutMultiplier?.toFixed(2)}x
            </Badge>
          </>
        ) : isLost ? (
          <Badge
            variant='outline'
            className='text-[9px] h-4 px-1.5 font-black bg-zinc-800 text-zinc-500 border-zinc-700 uppercase tracking-widest'
          >
            PERDEU
          </Badge>
        ) : (
          <div className='flex items-center gap-1.5'>
            <div className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' />
            <span className='text-[10px] font-bold text-amber-500/80 uppercase tracking-widest'>Jogando</span>
          </div>
        )}
      </div>
    </div>
  )
}
