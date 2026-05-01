import { cn } from '@/lib/utils'
import type { GamePhase } from '@/types/crash-game'

interface PhaseBadgeProps {
  phase: GamePhase
  countdown: number
}

export function PhaseBadge({ phase, countdown }: PhaseBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border',
        phase === 'BETTING' && 'bg-amber-950/30 text-amber-400 border-amber-500/20',
        phase === 'ACTIVE' && 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20',
        phase === 'CRASHED' && 'bg-red-950/30 text-red-400 border-red-500/20'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          phase === 'BETTING' && 'bg-amber-400',
          phase === 'ACTIVE' && 'bg-emerald-400 animate-pulse',
          phase === 'CRASHED' && 'bg-red-400'
        )}
      />
      {phase === 'BETTING' && `Apostas abertas — ${countdown}s`}
      {phase === 'ACTIVE' && 'Rodada em andamento'}
      {phase === 'CRASHED' && 'Crashed!'}
    </div>
  )
}
