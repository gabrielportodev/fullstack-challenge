'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer
} from 'recharts'
import type { CashoutMarker } from '@/types/crash-game'

interface CrashChartProps {
  phase: string
  multiplier: number
  cashoutMarkers: CashoutMarker[]
}

type Point = { t: number; mult: number }

function lineColor(mult: number, crashed: boolean): string {
  if (crashed) return '#ef4444'
  if (mult >= 10) return '#ef4444'
  if (mult >= 3) return '#f59e0b'
  return '#10b981'
}

const GROWTH_RATE = 0.1

function buildCurvePoints(elapsed: number): Point[] {
  if (elapsed <= 0) {
    return [{ t: 0, mult: 1.0 }]
  }

  const samples = Math.max(300, Math.ceil(elapsed * 120))
  const points: Point[] = []

  for (let i = 0; i <= samples; i += 1) {
    const t = (elapsed * i) / samples
    points.push({
      t,
      mult: Math.exp(GROWTH_RATE * t)
    })
  }

  return points
}

export function CrashCanvas({ phase, multiplier, cashoutMarkers }: CrashChartProps) {
  const [elapsed, setElapsed] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  const startRef = useRef<number | null>(null)
  const prevPhaseRef = useRef(phase)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase

    if (phase === 'ACTIVE' && prev !== 'ACTIVE') {
      startRef.current = performance.now()
      setElapsed(0)
    }
    if (phase === 'CRASHED' && prev === 'ACTIVE') {
      if (startRef.current) {
        setElapsed((performance.now() - startRef.current) / 1000)
      }
      setShowFlash(true)
    }
    if (phase === 'BETTING') {
      startRef.current = null
      setElapsed(0)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'ACTIVE' || !startRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tick = () => {
      if (!startRef.current) return
      setElapsed((performance.now() - startRef.current) / 1000)
      rafRef.current = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [phase])

  const crashed = phase === 'CRASHED'
  const color = lineColor(multiplier, crashed)
  const points = phase === 'BETTING' ? [] : buildCurvePoints(elapsed)

  const visiblePoints = phase === 'BETTING' ? [] : points
  const lastPoint = visiblePoints.at(-1)

  const xMax = Math.max(20, elapsed * 1.05)

  const yMax = Math.max(3.0, multiplier * 2.0)

  return (
    <div className='relative w-full h-full'>
      {showFlash && (
        <div
          className='absolute inset-0 z-10 pointer-events-none bg-red-500 animate-crash-flash'
          onAnimationEnd={() => setShowFlash(false)}
        />
      )}

      {visiblePoints.length >= 2 ? (
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={visiblePoints} margin={{ top: 40, right: 30, left: 10, bottom: 30 }}>
            <defs>
              <linearGradient id='areaFill' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={color} stopOpacity={0.18} />
                <stop offset='100%' stopColor={color} stopOpacity={0} />
              </linearGradient>

              <filter id='tipGlow' x='-80%' y='-80%' width='260%' height='260%'>
                <feGaussianBlur in='SourceGraphic' stdDeviation='4' result='blur' />
                <feMerge>
                  <feMergeNode in='blur' />
                  <feMergeNode in='SourceGraphic' />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid stroke='rgba(255,255,255,0.03)' strokeDasharray='' />
            <XAxis dataKey='t' hide type='number' domain={[0, xMax]} />
            <YAxis hide domain={[0.9, yMax]} />

            {cashoutMarkers.map((m, i) => (
              <ReferenceLine
                key={i}
                y={m.mult}
                stroke={m.isMe ? '#10b981' : '#6b7280'}
                strokeDasharray='4 3'
                strokeOpacity={0.45}
                label={{
                  value: `${m.username} ${m.mult.toFixed(2)}x`,
                  fill: m.isMe ? '#10b981' : '#9ca3af',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  position: 'insideTopRight'
                }}
              />
            ))}

            <Area
              type='basis'
              dataKey='mult'
              stroke={color}
              strokeWidth={3}
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='url(#areaFill)'
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            {lastPoint && (
              <ReferenceDot
                x={lastPoint.t}
                y={lastPoint.mult}
                r={0}
                shape={(props: { cx?: number; cy?: number }) => (
                  <g filter='url(#tipGlow)'>
                    <circle cx={props.cx} cy={props.cy} r={6} fill={color} />
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={11}
                      fill='none'
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={0.35}
                    />
                  </g>
                )}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className='w-full h-full' />
      )}

      <p className='absolute bottom-8 left-14 text-[11px] text-white/20 font-mono pointer-events-none select-none'>
        m(t) = e^(0.1·t)
      </p>
    </div>
  )
}
