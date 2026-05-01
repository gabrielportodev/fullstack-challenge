'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fmtBRL } from '@/lib/crash-game'
import { cn } from '@/lib/utils'

const QUICK_VALUES = [1, 5, 10, 25, 100]

interface OperationCardProps {
  type: 'credit' | 'debit'
  balance: number
  disabled: boolean
  onProcess: (type: 'credit' | 'debit', amountCents: number, reset: () => void) => void
}

export function OperationCard({ type, balance, disabled, onProcess }: OperationCardProps) {
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isCredit = type === 'credit'
  const amountCents = Math.round(parseFloat(inputVal || '0') * 100)
  const isValid = amountCents >= 100
  const afterBalance = isCredit ? balance + amountCents : balance - amountCents
  const canDebit = !isCredit ? amountCents <= balance : true

  function handleQuick(v: number) {
    setSelectedQuick(v)
    setInputVal(String(v))
    inputRef.current?.focus()
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedQuick(null)
    setInputVal(e.target.value)
  }

  function handleClear() {
    setInputVal('')
    setSelectedQuick(null)
    inputRef.current?.focus()
  }

  function handleProcess() {
    onProcess(type, amountCents, () => {
      setInputVal('')
      setSelectedQuick(null)
    })
  }

  return (
    <div
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition-opacity',
        disabled && 'opacity-45 pointer-events-none'
      )}
    >
      <div className='flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800'>
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0',
            isCredit ? 'bg-emerald-500/15' : 'bg-red-500/15'
          )}
        >
          {isCredit ? '⬆️' : '⬇️'}
        </div>
        <div className='flex flex-col gap-0.5'>
          <span className={cn('text-sm font-bold', isCredit ? 'text-emerald-400' : 'text-red-400')}>
            {isCredit ? 'Crédito' : 'Débito'}
          </span>
          <span className='text-[11px] text-zinc-500'>
            {isCredit ? 'Adicione fundos à sua conta' : 'Retire fundos da sua conta'}
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-3.5 px-5 py-5'>
        <div className='flex flex-col gap-2'>
          <Label className='text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>Valores rápidos</Label>
          <div className='flex gap-1.5 flex-wrap'>
            {QUICK_VALUES.map(v => {
              const sel = selectedQuick === v
              return (
                <Button
                  key={v}
                  variant='outline'
                  size='sm'
                  onClick={() => handleQuick(v)}
                  className={cn(
                    'flex-1 min-w-12 font-mono font-bold text-xs h-9 transition-all',
                    isCredit
                      ? sel
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                      : sel
                        ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                  )}
                >
                  R${v}
                </Button>
              )
            })}
          </div>
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label className='text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>
            Valor personalizado
          </Label>
          <div
            className={cn(
              'flex items-center bg-zinc-950 border rounded-xl overflow-hidden transition-all',
              isValid ? (isCredit ? 'border-emerald-500/40' : 'border-red-500/40') : 'border-zinc-800'
            )}
          >
            <span className='px-3 text-zinc-500 font-bold text-sm font-mono border-r border-zinc-800 self-stretch flex items-center'>
              R$
            </span>
            <Input
              ref={inputRef}
              type='number'
              min='1'
              step='0.01'
              placeholder='0,00'
              value={inputVal}
              onChange={handleInput}
              className='border-0 bg-transparent text-base font-black text-zinc-100 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 font-mono'
            />
            {inputVal && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClear}
                className='px-3 text-zinc-500 hover:text-zinc-300 h-12 rounded-none'
              >
                ×
              </Button>
            )}
          </div>
        </div>

        {isValid && (
          <div className='flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs'>
            <span className='text-zinc-500'>Saldo após operação</span>
            <span
              className={cn(
                'font-mono font-black',
                !isCredit && afterBalance < 0 ? 'text-red-400' : isCredit ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {fmtBRL(afterBalance)}
            </span>
          </div>
        )}

        <Button
          disabled={!isValid || (!isCredit && !canDebit)}
          onClick={handleProcess}
          className={cn(
            'w-full h-12 font-bold text-sm transition-all',
            isCredit
              ? 'bg-emerald-500 text-zinc-900 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:text-zinc-500'
              : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 disabled:opacity-35'
          )}
        >
          {!isValid
            ? 'Insira um valor'
            : !canDebit && !isCredit
              ? 'Saldo insuficiente'
              : `${isCredit ? '✓ Depositar' : '↓ Sacar'} ${fmtBRL(amountCents)}`}
        </Button>
      </div>
    </div>
  )
}
