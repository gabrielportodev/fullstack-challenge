import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BetRow } from './BetRow'
import type { GameBet } from '@/types/crash-game'

interface BetsPanelProps {
  bets: GameBet[]
}

export function BetsPanel({ bets }: BetsPanelProps) {
  return (
    <aside className='bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden' style={{ gridArea: 'right' }}>
      <div className='flex items-center justify-between px-3.5 pt-3.5 pb-2'>
        <CardHeader className='p-0'>
          <CardTitle className='text-[10px] font-semibold tracking-widest uppercase text-zinc-500'>
            Apostas da Rodada
          </CardTitle>
        </CardHeader>
        <Badge variant='outline' className='text-[11px] text-zinc-500 border-zinc-700 bg-zinc-800'>
          {bets.length} jogadores
        </Badge>
      </div>

      <ScrollArea className='flex-1 px-2.5 pb-2.5'>
        {bets.length === 0 ? (
          <p className='text-center text-zinc-600 text-xs py-5'>Aguardando apostas...</p>
        ) : (
          <div className='flex flex-col gap-1'>
            {bets.map(b => (
              <BetRow key={b.id} bet={b} />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  )
}
