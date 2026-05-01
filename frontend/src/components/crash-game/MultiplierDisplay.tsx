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
  const isActive = phase === 'ACTIVE'
  const isBetting = phase === 'BETTING'

  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none'>
      {isBetting ? (
        <div className='flex flex-col items-center animate-in fade-in zoom-in duration-500'>
          <div className='text-5xl md:text-6xl drop-shadow-lg mb-2'>🎯</div>
          <div
            className='text-[44px] md:text-[56px] font-mono font-black text-amber-400 leading-none tracking-tighter'
            style={{ textShadow: '0 0 40px rgba(245,166,35,0.6), 0 0 80px rgba(245,166,35,0.2)' }}
          >
            {countdown}s
          </div>
          <p className='text-[10px] md:text-[12px] tracking-[0.2em] uppercase font-bold text-amber-400/80 mt-2 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-500/20 backdrop-blur-sm'>
            Apostas abertas
          </p>
        </div>
      ) : (
        <div className='flex flex-col items-center'>
          <div
            className={cn(
              'font-mono font-black leading-none transition-all duration-300 tracking-tighter select-none',
              isActive ? 'text-emerald-400 text-7xl md:text-9xl' : 'text-red-500 text-7xl md:text-9xl animate-shiver'
            )}
            style={{
              textShadow: isActive
                ? '0 0 50px rgba(16,185,129,0.5), 0 0 100px rgba(16,185,129,0.2)'
                : '0 0 50px rgba(239,68,68,0.6), 0 0 100px rgba(239,68,68,0.2)'
            }}
          >
            {fmtMult(multiplier)}
          </div>
          <div
            className={cn(
              'mt-4 px-4 py-1.5 rounded-full border backdrop-blur-md transition-all duration-500',
              isActive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400 animate-bounce-short'
            )}
          >
            <p className='text-[10px] md:text-[12px] font-black tracking-[0.3em] uppercase'>
              {isActive ? 'EM ANDAMENTO' : `💥 CRASHED! ${fmtMult(crashPoint ?? multiplier)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
