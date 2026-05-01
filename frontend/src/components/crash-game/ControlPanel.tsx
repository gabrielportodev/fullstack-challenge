import { Separator } from '@/components/ui/separator'
import { PhaseBadge } from './PhaseBadge'
import { SeedHash } from './SeedHash'
import { BetControls } from './BetControls'
import { RoundHistory } from './RoundHistory'
import type { GameBet, GamePhase, HistoryEntry } from '@/types/crash-game'

interface ControlPanelProps {
  phase: GamePhase
  countdown: number
  seedHash: string
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
  history: HistoryEntry[]
  onPlaceBet: () => void
  onCashout: () => void
}

export function ControlPanel({
  phase,
  countdown,
  seedHash,
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
  history,
  onPlaceBet,
  onCashout
}: ControlPanelProps) {
  return (
    <aside className='bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden' style={{ gridArea: 'left' }}>
      <p className='text-[10px] font-semibold tracking-widest uppercase text-zinc-500 px-4 pt-3 pb-2'>Controles</p>

      <div className='px-3 mb-2'>
        <PhaseBadge phase={phase} countdown={countdown} />
      </div>

      {seedHash && <SeedHash hash={seedHash} />}

      <BetControls
        phase={phase}
        myBet={myBet}
        accessToken={accessToken}
        betAmount={betAmount}
        onBetAmountChange={onBetAmountChange}
        autoCashout={autoCashout}
        onAutoCashoutChange={onAutoCashoutChange}
        autoEnabled={autoEnabled}
        onAutoEnabledChange={onAutoEnabledChange}
        multiplier={multiplier}
        potential={potential}
        canBet={canBet}
        canCashout={canCashout}
        onPlaceBet={onPlaceBet}
        onCashout={onCashout}
      />

      <Separator className='bg-zinc-800' />

      <p className='text-[10px] font-semibold tracking-widest uppercase text-zinc-500 px-4 pt-3 pb-2'>
        Histórico de Rodadas
      </p>

      <RoundHistory history={history} />
    </aside>
  )
}
