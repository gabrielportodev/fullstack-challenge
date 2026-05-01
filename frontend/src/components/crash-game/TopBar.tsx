import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WalletStatus } from '@/stores/game.store'
import { cn } from '@/lib/utils'
import { fmtBRL, fmtMult } from '@/lib/crash-game'
import type { HistoryEntry } from '@/types/crash-game'
import { LogOut } from 'lucide-react'

interface TopBarProps {
  history: HistoryEntry[]
  balance: number
  username: string
  isConnected: boolean
  isAuthenticated: boolean
  walletStatus: WalletStatus
  onWalletClick: () => void
  onLoginClick: () => void
  onLogoutClick: () => void
}

export function TopBar({
  history,
  balance,
  username,
  isConnected,
  isAuthenticated,
  walletStatus,
  onWalletClick,
  onLoginClick,
  onLogoutClick
}: TopBarProps) {
  const topHistory = history.slice(0, 10)
  const userInitial = username.trim().charAt(0).toUpperCase() || 'J'

  return (
    <header
      className='flex items-center gap-3 px-3 desktop:px-4 bg-zinc-900/95 border-b border-zinc-800 z-10 backdrop-blur-sm h-[52px]'
      style={{ gridArea: 'topbar' }}
    >
      <div className='flex items-center gap-2 font-bold text-sm desktop:text-base shrink-0'>
        <div className='w-7 h-7 desktop:w-8 desktop:h-8 rounded-lg bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm desktop:text-base'>
          🎰
        </div>
        <span className='hidden sm:inline'>
          Crash<span className='text-emerald-400'>Game</span>
        </span>
      </div>

      <div className='flex items-center gap-1 desktop:gap-1.5 flex-1 overflow-hidden mask-fade-right'>
        {topHistory.map((r, i) => (
          <Badge
            key={i}
            variant='outline'
            className={cn(
              'shrink-0 font-mono text-[10px] desktop:text-[11px] font-bold border px-1.5 desktop:px-2',
              r.crashPoint < 2 && 'bg-red-950/40 text-red-400 border-red-500/20',
              r.crashPoint >= 2 && r.crashPoint < 5 && 'bg-amber-950/40 text-amber-400 border-amber-500/20',
              r.crashPoint >= 5 && 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
            )}
          >
            {fmtMult(r.crashPoint)}
          </Badge>
        ))}
      </div>

      <div className='flex items-center gap-2 desktop:gap-2.5 shrink-0'>
        {!isConnected && (
          <Badge variant='outline' className='text-red-400 border-red-500/30 bg-red-950/30 text-[10px] hidden sm:flex'>
            ● Off
          </Badge>
        )}

        {isAuthenticated ? (
          <div className='flex items-center gap-2'>
            <Card
              className='flex flex-row items-center gap-2 desktop:gap-3 px-2 desktop:px-3 py-1.5 desktop:py-2 bg-zinc-800/90 border-zinc-700 rounded-lg desktop:rounded-xl shadow-sm cursor-pointer hover:bg-zinc-800 transition-colors'
              onClick={onWalletClick}
            >
              <div className='flex flex-col desktop:flex-row desktop:items-center gap-0 desktop:gap-3 text-[10px] desktop:text-[11px] whitespace-nowrap'>
                <span className='font-bold text-emerald-400'>
                  {walletStatus === 'loading' ? (
                    <Skeleton className='h-3 w-16 desktop:w-20' />
                  ) : walletStatus === 'ready' ? (
                    fmtBRL(balance)
                  ) : (
                    'Sem carteira'
                  )}
                </span>
                <span className='hidden desktop:inline font-medium text-zinc-400 truncate max-w-[100px]'>
                  {username}
                </span>
              </div>
              <div className='w-6 h-6 desktop:w-8 desktop:h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] desktop:text-xs font-bold text-white shrink-0'>
                {userInitial}
              </div>
            </Card>

            <Button
              variant='outline'
              size='sm'
              className='hidden desktop:flex h-9 border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400 transition-all'
              onClick={onLogoutClick}
            >
              <LogOut className='w-4 h-4 mr-2' />
              Sair
            </Button>
          </div>
        ) : (
          <Button
            size='sm'
            className='h-8 desktop:h-9 bg-emerald-500 text-zinc-900 font-bold hover:bg-emerald-400'
            onClick={onLoginClick}
          >
            Entrar
          </Button>
        )}
      </div>
    </header>
  )
}
