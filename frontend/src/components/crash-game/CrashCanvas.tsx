'use client'

import { useRef, useEffect, useCallback } from 'react'
import { avatarColor } from '@/lib/crash-game'
import type { CashoutMarker } from '@/types/crash-game'

interface CrashCanvasProps {
  phase: string
  multiplier: number
  cashoutMarkers: CashoutMarker[]
}

const PAD = { left: 40, right: 30, top: 40, bottom: 30 }

export function CrashCanvas({ phase, multiplier, cashoutMarkers }: CrashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<{ t: number; mult: number }[]>([])
  const activeStartRef = useRef<number | null>(null)
  const scaleRef = useRef({ maxT: 10, maxMult: 2.5 })
  const markersRef = useRef<CashoutMarker[]>([])
  const flashRef = useRef(0)
  const lastPhaseRef = useRef(phase)
  const drawRef = useRef<((crashed: boolean) => void) | null>(null)

  useEffect(() => {
    markersRef.current = cashoutMarkers
  }, [cashoutMarkers])

  const draw = useCallback((crashed: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const iW = W - PAD.left - PAD.right
    const iH = H - PAD.top - PAD.bottom
    ctx.clearRect(0, 0, W, H)

    // Background Gradient
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2)
    bgGrad.addColorStop(0, '#09090b')
    bgGrad.addColorStop(1, '#020202')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let i = 1; i < 8; i++) {
      const x = PAD.left + (iW * i) / 8
      ctx.beginPath()
      ctx.moveTo(x, PAD.top)
      ctx.lineTo(x, PAD.top + iH)
      ctx.stroke()
    }
    for (let i = 1; i < 5; i++) {
      const y = PAD.top + (iH * i) / 5
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(PAD.left + iW, y)
      ctx.stroke()
    }

    const pts = pointsRef.current

    // Draw flash and return if no points
    if (pts.length < 2) {
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashRef.current})`
        ctx.fillRect(0, 0, W, H)
        flashRef.current *= 0.9
        if (flashRef.current < 0.01) flashRef.current = 0
        requestAnimationFrame(() => drawRef.current?.(crashed))
      }
      return
    }

    const { maxT, maxMult } = scaleRef.current
    const proj = (p: { t: number; mult: number }): [number, number] => [
      PAD.left + (p.t / maxT) * iW,
      PAD.top + iH - ((p.mult - 1) / Math.max(maxMult - 1, 0.01)) * iH
    ]

    const projected = pts.map(proj)
    const x0 = projected[0][0]
    const xN = projected[projected.length - 1][0]
    const tipMult = pts[pts.length - 1].mult

    // Line gradient
    const lineGrad = ctx.createLinearGradient(x0, 0, xN, 0)
    if (crashed) {
      lineGrad.addColorStop(0, '#3f3f46')
      lineGrad.addColorStop(1, '#ef4444')
    } else {
      const s3 = Math.min((3 - 1) / Math.max(tipMult - 1, 0.01), 1)
      const s10 = Math.min((10 - 1) / Math.max(tipMult - 1, 0.01), 1)
      lineGrad.addColorStop(0, '#10b981')
      if (s3 < 1) lineGrad.addColorStop(s3, '#10b981')
      if (s10 < 1) lineGrad.addColorStop(Math.min(s10, 0.999), '#f59e0b')
      lineGrad.addColorStop(1, tipMult > 10 ? '#ef4444' : tipMult > 3 ? '#f59e0b' : '#10b981')
    }

    // Fill under curve
    const fillGrad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + iH)
    fillGrad.addColorStop(0, crashed ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.15)')
    fillGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.moveTo(x0, PAD.top + iH)
    projected.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.lineTo(xN, PAD.top + iH)
    ctx.closePath()
    ctx.fillStyle = fillGrad
    ctx.fill()

    // Glow pass
    ctx.beginPath()
    ctx.moveTo(projected[0][0], projected[0][1])
    projected.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 8
    ctx.globalAlpha = 0.2
    ctx.stroke()
    ctx.globalAlpha = 1

    // Sharp line
    ctx.beginPath()
    ctx.moveTo(projected[0][0], projected[0][1])
    projected.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = crashed ? '#ef4444' : tipMult > 10 ? '#ef4444' : tipMult > 3 ? '#f59e0b' : '#10b981'
    ctx.shadowBlur = 12
    ctx.stroke()
    ctx.shadowBlur = 0

    // Tip dot/marker
    const [ex, ey] = projected[projected.length - 1]

    if (crashed) {
      // Crash marker
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 4
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 20
      const s = 14
      ctx.beginPath()
      ctx.moveTo(ex - s, ey - s)
      ctx.lineTo(ex + s, ey + s)
      ctx.moveTo(ex + s, ey - s)
      ctx.lineTo(ex - s, ey + s)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else {
      const tipC = tipMult > 10 ? '#ef4444' : tipMult > 3 ? '#f59e0b' : '#10b981'
      ctx.beginPath()
      ctx.arc(ex, ey, 6, 0, Math.PI * 2)
      ctx.fillStyle = tipC
      ctx.shadowColor = tipC
      ctx.shadowBlur = 20
      ctx.fill()
      ctx.shadowBlur = 0

      // Outer ring for tip
      ctx.beginPath()
      ctx.arc(ex, ey, 10, 0, Math.PI * 2)
      ctx.strokeStyle = tipC
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.3
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Cashout avatar markers
    markersRef.current.forEach(m => {
      const [mx, my] = proj(m)
      if (mx < PAD.left - 15 || mx > W + 15) return
      const isHigh = m.mult >= 5
      const borderC = m.isMe ? '#ffffff' : isHigh ? '#fbbf24' : '#10b981'
      const r = 14
      ctx.save()
      ctx.beginPath()
      ctx.arc(mx, my - r - 6, r, 0, Math.PI * 2)
      ctx.fillStyle = avatarColor(m.username)
      ctx.fill()
      ctx.strokeStyle = borderC
      ctx.lineWidth = m.isMe ? 3 : 2
      if (isHigh || m.isMe) {
        ctx.shadowColor = borderC
        ctx.shadowBlur = 10
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.font = 'bold 11px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(m.username[0].toUpperCase(), mx, my - r - 6)
      ctx.font = 'bold 10px sans-serif'
      ctx.fillStyle = borderC
      ctx.textBaseline = 'top'
      ctx.fillText(`${m.mult.toFixed(2)}x`, mx, my + 6)
      ctx.restore()
    })

    // Flash effect
    if (flashRef.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashRef.current})`
      ctx.fillRect(0, 0, W, H)
      flashRef.current *= 0.85
      if (flashRef.current < 0.01) flashRef.current = 0
      requestAnimationFrame(() => drawRef.current?.(crashed))
    }
  }, [])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio
      canvas.height = canvas.clientHeight * window.devicePixelRatio
      canvas.getContext('2d')?.scale(window.devicePixelRatio, window.devicePixelRatio)
      draw(phase === 'CRASHED')
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw, phase])

  useEffect(() => {
    if (phase === 'ACTIVE') {
      activeStartRef.current = performance.now()
      pointsRef.current = []
      scaleRef.current = { maxT: 10, maxMult: 2.5 }
    }
    if (phase === 'CRASHED' && lastPhaseRef.current === 'ACTIVE') {
      flashRef.current = 0.4
    }
    if (phase === 'BETTING') {
      pointsRef.current = []
      activeStartRef.current = null
      draw(false)
    }
    lastPhaseRef.current = phase
  }, [phase, draw])

  useEffect(() => {
    if ((phase !== 'ACTIVE' && phase !== 'CRASHED') || !activeStartRef.current) return
    const elapsed = (performance.now() - activeStartRef.current) / 1000
    pointsRef.current.push({ t: elapsed, mult: multiplier })
    if (elapsed > scaleRef.current.maxT * 0.8) scaleRef.current.maxT = elapsed * 1.25
    if (multiplier > scaleRef.current.maxMult * 0.8) scaleRef.current.maxMult = multiplier * 1.25
    draw(phase === 'CRASHED')
  }, [multiplier, phase, draw, cashoutMarkers])

  return <canvas ref={canvasRef} className='w-full h-full block' />
}
