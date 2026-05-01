import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fmtBRL } from '@/lib/crash-game'
import { cn } from '@/lib/utils'

export interface TxEntry {
  id: number
  type: 'credit' | 'debit'
  amountCents: number
  balanceAfter: number
  time: string
}

interface TransactionHistoryProps {
  txHistory: TxEntry[]
  onClear: () => void
}

export function TransactionHistory({ txHistory, onClear }: TransactionHistoryProps) {
  return (
    <div className='bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-zinc-800'>
        <span className='text-sm font-semibold text-zinc-100'>Histórico de transações</span>
        {txHistory.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onClear}
            className='text-[11px] text-zinc-500 hover:text-zinc-300 h-auto py-1 px-2'
          >
            Limpar histórico
          </Button>
        )}
      </div>

      {txHistory.length === 0 ? (
        <div className='py-8 text-center text-zinc-500 text-sm'>
          Nenhuma transação ainda — realize um depósito ou saque acima.
        </div>
      ) : (
        <ScrollArea className='max-h-80'>
          <div className='flex flex-col'>
            {txHistory.map(tx => (
              <div
                key={tx.id}
                className='flex items-center gap-3 px-5 py-3 border-b border-zinc-800 last:border-0 transition-colors hover:bg-zinc-800/30'
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0',
                    tx.type === 'credit' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                  )}
                >
                  {tx.type === 'credit' ? '⬆️' : '⬇️'}
                </div>
                <div className='flex flex-col gap-0.5 flex-1'>
                  <span className='text-sm font-semibold text-zinc-100'>
                    {tx.type === 'credit' ? 'Depósito' : 'Saque'}
                  </span>
                  <span className='text-[11px] text-zinc-500'>{tx.time}</span>
                </div>
                <div className='flex flex-col items-end gap-0.5'>
                  <span
                    className={cn(
                      'font-mono text-sm font-black',
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {fmtBRL(tx.amountCents)}
                  </span>
                  <span className='font-mono text-[11px] text-zinc-500'>saldo: {fmtBRL(tx.balanceAfter)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
