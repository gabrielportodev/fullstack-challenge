import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import type { WalletStatus } from '@/stores/game.store'
import { fmtBRL } from '@/lib/crash-game'
import type { GameBet, GamePhase } from '@/types/crash-game'
import { cn } from '@/lib/utils'
import { Minus, Plus, Zap } from 'lucide-react'

interface BetControlsProps {
  phase: GamePhase
  myBet: GameBet | null
  accessToken: string | null
  balance: number
  walletStatus: WalletStatus
  betAmount: string
  onBetAmountChange: (v: string) => void
  autoCashout: string
  onAutoCashoutChange: (v: string) => void
  autoEnabled: boolean
  onAutoEnabledChange: (v: boolean) => void
  multiplier: number
  potential: number | null
  canBet: boolean
  canCashout: boolean
  onPlaceBet: () => void
  onCashout: () => void
  compact?: boolean
}

const QUICK_AMOUNTS = ['1', '5', '25', '100']

export function BetControls({
  phase,
  myBet,
  accessToken,
  balance,
  walletStatus,
  betAmount,
  onBetAmountChange,
  autoCashout,
  onAutoCashoutChange,
  autoEnabled,
  onAutoEnabledChange,
  potential,
  canBet,
  canCashout,
  onPlaceBet,
  onCashout,
  compact = false
}: BetControlsProps) {
  const walletReady = walletStatus === 'ready'
  const walletLoading = walletStatus === 'loading'
  const insufficientBalance = accessToken && walletReady && balance <= 0
  const betDisabled = walletLoading || (walletReady && !canBet)

  function addAmount(v: string) {
    onBetAmountChange(String(parseFloat(betAmount || '0') + parseFloat(v)))
  }

  function multiplyAmount(factor: number) {
    onBetAmountChange(String(Math.floor(parseFloat(betAmount || '0') * factor)))
  }

  if (!accessToken) {
    return (
      <div className={cn('px-3 flex flex-col gap-3 pb-3', compact && 'p-0 pb-1')}>
        <div className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-5 flex flex-col items-center gap-3 text-center'>
          {!compact && (
            <>
              <p className='text-sm text-zinc-400'>Você está assistindo ao jogo.</p>
              <p className='text-xs text-zinc-500'>Faça login para apostar e acompanhar seu saldo.</p>
            </>
          )}
          <Button
            className='w-full h-11 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-900 shadow-lg shadow-emerald-500/20'
            onClick={onPlaceBet}
          >
            Entrar para jogar
          </Button>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className='flex flex-col gap-3'>
        <div className='grid grid-cols-2 gap-3'>
          {/* Bet Amount Card */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex justify-between items-center px-1'>
              <Label className='text-[10px] font-black uppercase text-zinc-500 tracking-tighter'>Quantia</Label>
              <div className='flex gap-1'>
                <button 
                  onClick={() => multiplyAmount(0.5)}
                  disabled={betDisabled}
                  className='text-[9px] font-bold text-zinc-400 hover:text-zinc-100 bg-zinc-800 px-1.5 rounded border border-zinc-700 disabled:opacity-30'
                >
                  ½
                </button>
                <button 
                  onClick={() => multiplyAmount(2)}
                  disabled={betDisabled}
                  className='text-[9px] font-bold text-zinc-400 hover:text-zinc-100 bg-zinc-800 px-1.5 rounded border border-zinc-700 disabled:opacity-30'
                >
                  2×
                </button>
              </div>
            </div>
            <div className='flex items-center bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-11 focus-within:border-emerald-500/40 transition-all'>
              <div className='pl-3 pr-1 text-zinc-600 font-bold text-xs'>R$</div>
              <Input
                type='number'
                value={betAmount}
                onChange={e => onBetAmountChange(e.target.value)}
                disabled={!walletReady || !canBet}
                className='border-0 bg-transparent text-sm font-black focus-visible:ring-0 h-full p-0'
              />
            </div>
          </div>

          {/* Auto Cashout Card */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex justify-between items-center px-1'>
              <Label className='text-[10px] font-black uppercase text-zinc-500 tracking-tighter'>Auto-Saque</Label>
              <Switch
                checked={autoEnabled}
                onCheckedChange={onAutoEnabledChange}
                className='scale-75 data-[state=checked]:bg-emerald-500'
              />
            </div>
            <div className={cn(
              'flex items-center bg-zinc-900 border rounded-xl overflow-hidden h-11 transition-all',
              autoEnabled ? 'border-zinc-700' : 'border-zinc-800 opacity-50'
            )}>
              <div className='pl-3 pr-1 text-zinc-600 font-bold text-xs'>×</div>
              <Input
                type='number'
                step='0.1'
                value={autoCashout}
                onChange={e => onAutoCashoutChange(e.target.value)}
                disabled={!autoEnabled}
                className='border-0 bg-transparent text-sm font-black focus-visible:ring-0 h-full p-0'
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {canCashout ? (
          <Button
            className='w-full h-12 text-sm font-black bg-amber-500 hover:bg-amber-400 text-zinc-900 animate-pulse-ring rounded-xl shadow-lg shadow-amber-500/10'
            onClick={onCashout}
          >
            💰 SAQUE AGORA {potential ? fmtBRL(potential) : ''}
          </Button>
        ) : (
          <Button
            className={cn(
              'w-full h-12 text-sm font-black rounded-xl transition-all duration-300 shadow-lg',
              myBet
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-default'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-900 shadow-emerald-500/20'
            )}
            onClick={onPlaceBet}
            disabled={betDisabled}
          >
            {walletLoading ? (
              <Skeleton className='h-4 w-24 bg-zinc-900/20' />
            ) : myBet ? (
              <div className='flex items-center gap-2'>
                <Zap className='w-4 h-4 fill-zinc-500' />
                APOSTADO
              </div>
            ) : (
              'FAZER APOSTA'
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className='px-3 flex flex-col gap-4 pb-4'>
      {/* Bet amount */}
      <div className='flex flex-col gap-2'>
        <div className='flex justify-between items-end'>
          <Label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>Valor da Aposta</Label>
          {walletLoading ? (
            <Skeleton className='h-3 w-16' />
          ) : (
            <span className='text-[10px] font-bold text-zinc-500'>{fmtBRL(balance)} SALDO</span>
          )}
        </div>
        <div className='group flex items-center bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-all shadow-inner'>
          <div className='px-4 text-zinc-600 text-sm font-black'>R$</div>
          <Input
            type='number'
            min='1'
            max='1000'
            value={betAmount}
            onChange={e => onBetAmountChange(e.target.value)}
            disabled={!walletReady || !canBet}
            className='border-0 bg-transparent text-lg font-black focus-visible:ring-0 focus-visible:ring-offset-0 h-12 p-0'
          />
          <div className='flex items-center gap-1 pr-2'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'
              onClick={() => multiplyAmount(0.5)}
              disabled={betDisabled}
            >
              /2
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'
              onClick={() => multiplyAmount(2)}
              disabled={betDisabled}
            >
              x2
            </Button>
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className='grid grid-cols-4 gap-2'>
        {QUICK_AMOUNTS.map(v => (
          <Button
            key={v}
            variant='outline'
            size='sm'
            className='text-[11px] font-black h-9 bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-emerald-500 hover:text-zinc-900 hover:border-emerald-500 transition-all rounded-lg'
            onClick={() => addAmount(v)}
            disabled={!walletReady || !canBet}
          >
            +{v}
          </Button>
        ))}
      </div>

      {/* Auto cashout toggle */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
        autoEnabled ? 'bg-zinc-900/50 border-emerald-500/20' : 'bg-zinc-900/30 border-zinc-800'
      )}>
        <Switch
          checked={autoEnabled}
          onCheckedChange={onAutoEnabledChange}
          className='data-[state=checked]:bg-emerald-500'
        />
        <div className='flex flex-col flex-1 cursor-pointer' onClick={() => onAutoEnabledChange(!autoEnabled)}>
          <Label className='text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer'>
            Auto Cash Out
          </Label>
          <span className='text-[9px] text-zinc-600 font-bold'>Saque automático ativado</span>
        </div>
        <div className='relative flex items-center bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800'>
          <span className='text-zinc-600 font-black text-xs mr-1'>×</span>
          <Input
            type='number'
            step='0.1'
            min='1.1'
            value={autoCashout}
            onChange={e => onAutoCashoutChange(e.target.value)}
            disabled={!autoEnabled}
            className='w-14 h-7 text-center text-xs font-black bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0'
          />
        </div>
      </div>

      {/* Action button */}
      {canCashout ? (
        <div className='flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
          <Button
            className='w-full h-14 text-base font-black bg-amber-500 hover:bg-amber-400 text-zinc-900 shadow-lg shadow-amber-500/20 rounded-xl'
            onClick={onCashout}
          >
            💰 CASH OUT {potential ? fmtBRL(potential) : ''}
          </Button>
          {potential && (
            <p className='text-center text-[10px] text-zinc-500 uppercase font-black tracking-widest'>
              Lucro Estimado:{' '}
              <span className='text-emerald-400'>
                {fmtBRL(potential - Math.round(parseFloat(betAmount) * 100))}
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          <Button
            className={cn(
              'w-full h-14 text-base font-black transition-all duration-300 shadow-xl rounded-xl',
              myBet
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-default'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-900 shadow-emerald-500/20'
            )}
            onClick={onPlaceBet}
            disabled={betDisabled}
          >
            {walletLoading ? (
              <Skeleton className='h-4 w-32 bg-zinc-900/20' />
            ) : walletStatus === 'missing' ? (
              'CRIAR CARTEIRA'
            ) : insufficientBalance ? (
              'DEPOSITAR AGORA'
            ) : myBet ? (
              phase === 'ACTIVE' ? (
                'AGUARDANDO SUBIDA...'
              ) : (
                '✓ APOSTA CONFIRMADA'
              )
            ) : phase === 'CRASHED' ? (
              'AGUARDAR PRÓXIMA'
            ) : (
              'FAZER APOSTA'
            )}
          </Button>

          {insufficientBalance && (
            <p className='text-center text-[10px] text-red-400 font-black uppercase tracking-tighter'>
              Saldo insuficiente. Deposite para jogar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
