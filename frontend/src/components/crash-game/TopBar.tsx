import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fmtBRL, fmtMult } from '@/lib/crash-game'
import type { HistoryEntry } from '@/types/crash-game'

interface TopBarProps {
  history: HistoryEntry[]
  balance: number
  username: string
  isConnected: boolean
}

export function TopBar({ history, balance, username, isConnected }: TopBarProps) {
  const topHistory = history.slice(0, 12)
  const userInitial = username.trim().charAt(0).toUpperCase() || 'J'

  return (
    <header
      className='flex items-center gap-3 px-4 bg-zinc-900/95 border-b border-zinc-800 z-10 backdrop-blur-sm'
      style={{ gridArea: 'topbar' }}
    >
      <div className='flex items-center gap-2 font-bold text-base shrink-0'>
        <div className='w-8 h-8 rounded-lg bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base'>
          🎰
        </div>
        <span>
          Crash<span className='text-emerald-400'>Game</span>
        </span>
      </div>

      <div className='flex items-center gap-1.5 flex-1 overflow-hidden'>
        {topHistory.map((r, i) => (
          <Badge
            key={i}
            variant='outline'
            className={cn(
              'shrink-0 font-mono text-[11px] font-bold border',
              r.crashPoint < 2 && 'bg-red-950/40 text-red-400 border-red-500/20',
              r.crashPoint >= 2 && r.crashPoint < 5 && 'bg-amber-950/40 text-amber-400 border-amber-500/20',
              r.crashPoint >= 5 && 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
            )}
          >
            {fmtMult(r.crashPoint)}
          </Badge>
        ))}
      </div>

      <div className='flex items-center gap-2.5 shrink-0'>
        {!isConnected && (
          <Badge variant='outline' className='text-red-400 border-red-500/30 bg-red-950/30 text-[11px]'>
            ● Desconectado
          </Badge>
        )}
        <Card className='flex flex-row items-center gap-3 px-3 py-2 my-2 bg-zinc-800/90 border-zinc-700 rounded-xl shadow-sm'>
          <div className='flex items-center gap-3 text-[11px] whitespace-nowrap'>
            <span className='font-semibold text-emerald-400'>
              <span className='text-zinc-400 font-normal mr-1'>Saldo:</span>
              {fmtBRL(balance)}
            </span>
            <span className='text-zinc-400'>Usuário:</span>
            <span className='font-medium text-zinc-100 max-w-[160px] truncate'>{username}</span>
          </div>
          <div className='w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0'>
            {userInitial}
          </div>
        </Card>
      </div>
    </header>
  )
}
