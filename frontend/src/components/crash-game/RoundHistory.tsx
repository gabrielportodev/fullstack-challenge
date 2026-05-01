import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { fmtMult, multColor } from '@/lib/crash-game'
import type { HistoryEntry } from '@/types/crash-game'

interface RoundHistoryProps {
  history: HistoryEntry[]
}

export function RoundHistory({ history }: RoundHistoryProps) {
  return (
    <ScrollArea className='flex-1 px-3 pb-3'>
      <div className='flex flex-col gap-1'>
        {history.map((r, i) => (
          <div
            key={i}
            className='flex items-center gap-2 px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs'
          >
            <span className={cn('font-mono font-bold text-[13px] min-w-[52px]', multColor(r.crashPoint))}>
              {fmtMult(r.crashPoint)}
            </span>
            <span className='flex-1 text-zinc-500'>
              {r.crashPoint < 2 ? '💥 Bust' : r.crashPoint >= 5 ? '🚀 Mega' : '✓ Ok'}
            </span>
            <span className='text-zinc-600 text-[11px]'>{r.time}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
