import { cn } from '@/lib/utils'
import { fmtMult } from '@/lib/crash-game'
import type { GamePhase } from '@/types/crash-game'

interface MultiplierDisplayProps {
  phase: GamePhase
  multiplier: number
  countdown: number
  crashPoint: number | null
}

export function MultiplierDisplay({ phase, multiplier, countdown, crashPoint }: MultiplierDisplayProps) {
  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
      {phase === 'BETTING' ? (
        <>
          <div className='text-5xl'>🎯</div>
          <div
            className='text-[40px] font-mono font-bold text-amber-400 mt-1'
            style={{ textShadow: '0 0 30px rgba(245,166,35,0.5)' }}
          >
            {countdown}s
          </div>
          <p className='text-[11px] tracking-widest uppercase text-amber-400/70 mt-1'>Apostas abertas</p>
        </>
      ) : (
        <>
          <div
            className={cn(
              'font-mono font-bold leading-none transition-colors',
              phase === 'ACTIVE' ? 'text-emerald-400 text-7xl' : 'text-red-400 text-7xl'
            )}
            style={{ textShadow: '0 0 40px currentColor', letterSpacing: '-2px' }}
          >
            {fmtMult(multiplier)}
          </div>
          <p className='text-xs font-medium tracking-widest uppercase mt-1 opacity-60 text-zinc-100'>
            {phase === 'ACTIVE' ? 'Em andamento' : `💥 Crashed @ ${fmtMult(crashPoint ?? multiplier)}`}
          </p>
        </>
      )}
    </div>
  )
}
