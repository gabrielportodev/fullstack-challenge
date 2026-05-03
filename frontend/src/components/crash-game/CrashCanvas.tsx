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

function buildGradientStops(xMax: number, crashed: boolean) {
  if (crashed) {
    return (
      <>
        <stop offset='0%' stopColor='#ef4444' />
        <stop offset='100%' stopColor='#ef4444' />
      </>
    )
  }

  const t3x = Math.log(3) / GROWTH_RATE
  const t10x = Math.log(10) / GROWTH_RATE

  const p3x = Math.min(98, (t3x / xMax) * 100)
  const p10x = Math.min(98, (t10x / xMax) * 100)

  const blend = Math.max(3, (p3x - 0) * 0.3)

  return (
    <>
      <stop offset='0%' stopColor='#10b981' />
      <stop offset={`${Math.max(0, p3x - blend)}%`} stopColor='#10b981' />
      <stop offset={`${p3x}%`} stopColor='#f59e0b' />
      {p10x <= 98 && (
        <>
          <stop offset={`${Math.min(98, p10x - blend)}%`} stopColor='#f59e0b' />
          <stop offset={`${p10x}%`} stopColor='#ef4444' />
        </>
      )}
      <stop offset='100%' stopColor='#ef4444' />
    </>
  )
}

const GROWTH_RATE = 0.125

function buildCurvePoints(elapsed: number): Point[] {
  if (elapsed <= 0) return [{ t: 0, mult: 1.0 }]

  const points: Point[] = []
  const steps = 60

  for (let i = 0; i <= steps; i++) {
    const t = (elapsed * i) / steps
    points.push({
      t,
      // m(t) = e^(k*t)
      mult: Math.pow(Math.E, GROWTH_RATE * t)
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

  const [currentPhase, setCurrentPhase] = useState(phase)
  if (phase !== currentPhase) {
    setCurrentPhase(phase)
    if (phase === 'BETTING') setElapsed(0)
  }

  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase

    if (phase === 'ACTIVE' && prev !== 'ACTIVE') {
      startRef.current = performance.now()
    }
    if (phase === 'CRASHED' && prev === 'ACTIVE') {
      setShowFlash(true)
    }
    if (phase === 'BETTING') {
      startRef.current = null
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'ACTIVE') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = () => {
      if (startRef.current) {
        setElapsed((performance.now() - startRef.current) / 1000)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  const crashed = phase === 'CRASHED'
  const color = lineColor(multiplier, crashed)
  const visiblePoints = phase === 'BETTING' && elapsed === 0 ? [] : buildCurvePoints(elapsed)
  const lastPoint = visiblePoints.at(-1)

  const xMax = Math.max(10, elapsed * 1.2)
  const yMax = Math.max(2.5, multiplier * 1.5)

  return (
    <div className='relative w-full h-full bg-[#0a0a0a]'>
      {showFlash && (
        <div
          className='absolute inset-0 z-10 pointer-events-none bg-red-500/20 animate-crash-flash'
          onAnimationEnd={() => setShowFlash(false)}
        />
      )}

      {visiblePoints.length >= 2 ? (
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={visiblePoints} margin={{ top: 40, right: 40, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id='lineGradient' x1='0' y1='0' x2='1' y2='0' gradientUnits='objectBoundingBox'>
                {buildGradientStops(xMax, crashed)}
              </linearGradient>
              <linearGradient id='areaFill' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={color} stopOpacity={0.2} />
                <stop offset='100%' stopColor={color} stopOpacity={0} />
              </linearGradient>
              <filter id='tipGlow' x='-100%' y='-100%' width='300%' height='300%'>
                <feGaussianBlur in='SourceGraphic' stdDeviation='5' result='blur' />
                <feMerge>
                  <feMergeNode in='blur' />
                  <feMergeNode in='SourceGraphic' />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid stroke='rgba(255,255,255,0.02)' vertical={false} />

            <XAxis dataKey='t' type='number' hide domain={[0, xMax]} />
            <YAxis type='number' hide domain={[1.0, yMax]} />

            {cashoutMarkers.map((m, i) => {
              const tCashout = Math.log(m.mult) / GROWTH_RATE
              const dotColor = m.isMe ? '#10b981' : '#6b7280'
              return (
                <g key={i}>
                  <ReferenceLine
                    y={m.mult}
                    stroke={dotColor}
                    strokeDasharray='5 5'
                    strokeOpacity={0.5}
                    label={{
                      value: m.username,
                      fill: dotColor,
                      fontSize: 10,
                      position: 'right'
                    }}
                  />
                  <ReferenceDot
                    x={tCashout}
                    y={m.mult}
                    r={0}
                    shape={(props: { cx?: number; cy?: number }) => (
                      <circle cx={props.cx} cy={props.cy} r={5} fill={dotColor} opacity={0.95} />
                    )}
                  />
                </g>
              )
            })}

            <Area
              type='monotone'
              dataKey='mult'
              stroke='url(#lineGradient)'
              strokeWidth={4}
              fill='url(#areaFill)'
              isAnimationActive={false}
              connectNulls
            />

            {lastPoint && (
              <ReferenceDot
                x={lastPoint.t}
                y={lastPoint.mult}
                r={0}
                shape={(props: { cx?: number; cy?: number }) => (
                  <g filter='url(#tipGlow)'>
                    <circle cx={props.cx} cy={props.cy} r={5} fill={color} />
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={12}
                      fill='none'
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.2}
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

      <div className='absolute bottom-6 left-10 opacity-30'>
        <p className='text-[10px] text-white font-mono'>f(t) = e^{GROWTH_RATE}t</p>
      </div>
    </div>
  )
}
