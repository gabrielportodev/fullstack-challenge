import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Wallet } from '@/api/wallets.api'

interface WalletBalanceCardProps {
  wallet: Wallet | null
  walletLoadError: boolean
  balanceCents: number
  username: string
  onCreateWallet: () => void
  onRetry: () => void
}

export function WalletBalanceCard({
  wallet,
  walletLoadError,
  balanceCents,
  username,
  onCreateWallet,
  onRetry
}: WalletBalanceCardProps) {
  return (
    <div className='relative bg-zinc-900 border border-zinc-800 rounded-2xl px-8 py-7 flex items-center justify-between flex-wrap gap-4 overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_10%_50%,rgba(57,232,124,0.06)_0%,transparent_70%)] pointer-events-none' />

      <div className='flex flex-col gap-1.5 relative'>
        <span className='text-[10px] font-semibold tracking-[1.5px] uppercase text-zinc-500'>Saldo disponível</span>
        <div className='flex items-baseline gap-2'>
          {wallet ? (
            <>
              <span className='font-mono text-lg text-zinc-500'>R$</span>
              <span
                className='font-mono text-[42px] font-black text-emerald-400 leading-none tracking-tight'
                style={{ textShadow: '0 0 40px rgba(57,232,124,0.35)' }}
              >
                {(balanceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>
          ) : (
            <span className='font-mono text-[42px] font-black text-zinc-500 leading-none tracking-tight'>
              {walletLoadError ? 'Erro' : 'Sem carteira'}
            </span>
          )}
        </div>
        <span className='text-xs text-zinc-500 mt-1'>
          {wallet
            ? 'Atualizado agora • Conta verificada'
            : walletLoadError
              ? 'Falha ao carregar'
              : 'Crie sua carteira para começar'}
        </span>
      </div>

      <div className='flex flex-col items-end gap-2.5 relative'>
        {wallet ? (
          <>
            <Badge className='flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-bold text-[11px] px-3.5 py-1 rounded-full'>
              <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot shrink-0' />
              Conta ativa
            </Badge>
            <span className='text-sm font-semibold text-zinc-100'>
              {username}
              <span className='text-zinc-500 font-normal text-[11px] ml-1.5'>jogador</span>
            </span>
          </>
        ) : walletLoadError ? (
          <Button
            variant='outline'
            size='sm'
            onClick={onRetry}
            className='border-zinc-700 bg-zinc-800/90 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          >
            Tentar novamente
          </Button>
        ) : (
          <Button onClick={onCreateWallet} className='bg-emerald-500 text-zinc-900 font-bold hover:bg-emerald-400 px-6'>
            Criar carteira
          </Button>
        )}
      </div>
    </div>
  )
}
