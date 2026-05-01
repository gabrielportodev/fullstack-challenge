import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { fmtBRL, fmtMult } from '@/lib/crash-game'
import type { GameBet, GamePhase } from '@/types/crash-game'

interface BetControlsProps {
  phase: GamePhase
  myBet: GameBet | null
  accessToken: string | null
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
}

const QUICK_AMOUNTS = ['1', '5', '25', '100']

export function BetControls({
  phase,
  myBet,
  accessToken,
  betAmount,
  onBetAmountChange,
  autoCashout,
  onAutoCashoutChange,
  autoEnabled,
  onAutoEnabledChange,
  multiplier,
  potential,
  canBet,
  canCashout,
  onPlaceBet,
  onCashout
}: BetControlsProps) {
  function addAmount(v: string) {
    onBetAmountChange(String(parseFloat(betAmount || '0') + parseFloat(v)))
  }

  return (
    <div className='px-3 flex flex-col gap-2 pb-3'>
      {/* Bet amount */}
      <div className='flex flex-col gap-1'>
        <Label className='text-xs text-zinc-500'>Valor da Aposta</Label>
        <div className='flex items-center bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden'>
          <span className='px-2.5 text-zinc-500 text-sm font-semibold'>R$</span>
          <Input
            type='number'
            min='1'
            max='1000'
            value={betAmount}
            onChange={e => onBetAmountChange(e.target.value)}
            disabled={!canBet}
            className='border-0 bg-transparent text-base font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 h-10'
          />
        </div>
      </div>

      {/* Quick amounts */}
      <div className='grid grid-cols-4 gap-1'>
        {QUICK_AMOUNTS.map(v => (
          <Button
            key={v}
            variant='outline'
            size='sm'
            className='text-[11px] font-semibold h-7 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-emerald-950/50 hover:text-emerald-400 hover:border-emerald-500/40'
            onClick={() => addAmount(v)}
            disabled={!canBet}
          >
            +{v}
          </Button>
        ))}
      </div>

      {/* Auto cashout toggle */}
      <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700'>
        <Switch
          checked={autoEnabled}
          onCheckedChange={onAutoEnabledChange}
          className='data-[state=checked]:bg-emerald-500'
        />
        <Label
          className='text-xs text-zinc-400 flex-1 cursor-pointer'
          onClick={() => onAutoEnabledChange(!autoEnabled)}
        >
          Auto Cash Out
        </Label>
        <Input
          type='number'
          step='0.1'
          min='1.1'
          value={autoCashout}
          onChange={e => onAutoCashoutChange(e.target.value)}
          disabled={!autoEnabled}
          className='w-16 h-7 text-center text-xs font-semibold bg-zinc-900 border-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0'
        />
        <span className='text-xs text-zinc-500'>×</span>
      </div>

      {/* Action button */}
      {canCashout ? (
        <>
          <Button
            className='w-full h-11 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-900'
            onClick={onCashout}
          >
            💰 Cash Out {potential ? fmtBRL(potential) : ''}
          </Button>
          {potential && (
            <p className='text-center text-xs text-zinc-500'>
              Potencial: <strong className='text-emerald-400 font-mono'>{fmtBRL(potential)}</strong> @{' '}
              <strong className='text-emerald-400 font-mono'>{fmtMult(multiplier)}</strong>
            </p>
          )}
        </>
      ) : (
        <Button
          className='w-full h-11 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-900 disabled:opacity-35'
          onClick={onPlaceBet}
          disabled={!canBet || !accessToken}
        >
          {!accessToken
            ? 'Faça login para jogar'
            : myBet
              ? phase === 'ACTIVE'
                ? 'Aguardando...'
                : '✓ Apostado'
              : phase === 'CRASHED'
                ? 'Próxima rodada...'
                : '🎲 Apostar'}
        </Button>
      )}
    </div>
  )
}
