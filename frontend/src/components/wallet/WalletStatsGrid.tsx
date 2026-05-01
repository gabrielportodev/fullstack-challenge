import { fmtBRL } from '@/lib/crash-game'
import type { TxEntry } from './TransactionHistory'

interface WalletStatsGridProps {
  txHistory: TxEntry[]
}

export function WalletStatsGrid({ txHistory }: WalletStatsGridProps) {
  const totalIn = txHistory.filter(t => t.type === 'credit').reduce((s, t) => s + t.amountCents, 0)
  const totalOut = txHistory.filter(t => t.type === 'debit').reduce((s, t) => s + t.amountCents, 0)
  const creditCount = txHistory.filter(t => t.type === 'credit').length
  const debitCount = txHistory.filter(t => t.type === 'debit').length

  const stats = [
    {
      label: 'Total depositado',
      value: fmtBRL(totalIn),
      color: totalIn > 0 ? 'text-emerald-400' : 'text-zinc-100',
      sub: `${creditCount} transações`
    },
    {
      label: 'Total sacado',
      value: fmtBRL(totalOut),
      color: totalOut > 0 ? 'text-red-400' : 'text-zinc-100',
      sub: `${debitCount} transações`
    },
    {
      label: 'Operações hoje',
      value: String(txHistory.length),
      color: 'text-zinc-100',
      sub: 'na sessão atual'
    }
  ]

  return (
    <div className='grid grid-cols-3 gap-3'>
      {stats.map(stat => (
        <div key={stat.label} className='bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 flex flex-col gap-1'>
          <span className='text-[10px] font-semibold tracking-[1.2px] uppercase text-zinc-500'>{stat.label}</span>
          <span className={`font-mono text-lg font-black ${stat.color}`}>{stat.value}</span>
          <span className='text-[11px] text-zinc-500 mt-0.5'>{stat.sub}</span>
        </div>
      ))}
    </div>
  )
}
