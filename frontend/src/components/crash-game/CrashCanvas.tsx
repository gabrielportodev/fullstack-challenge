'use client'

import { useRef, useEffect, useCallback } from 'react'
import { avatarColor } from '@/lib/crash-game'
import type { CashoutMarker } from '@/types/crash-game'

interface CrashCanvasProps {
  phase: string
  multiplier: number
  cashoutMarkers: CashoutMarker[]
}

const PAD = { left: 36, right: 24, top: 40, bottom: 28 }

export function CrashCanvas({ phase, multiplier, cashoutMarkers }: CrashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<{ t: number; mult: number }[]>([])
  const activeStartRef = useRef<number | null>(null)
  const scaleRef = useRef({ maxT: 12, maxMult: 3 })
  const markersRef = useRef<CashoutMarker[]>([])

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

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
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
    if (pts.length < 2) return

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
      lineGrad.addColorStop(0, '#666666')
      lineGrad.addColorStop(1, '#ff4d6a')
    } else {
      const s3 = Math.min((3 - 1) / Math.max(tipMult - 1, 0.01), 1)
      const s10 = Math.min((10 - 1) / Math.max(tipMult - 1, 0.01), 1)
      lineGrad.addColorStop(0, '#00ff66')
      if (s3 < 1) lineGrad.addColorStop(s3, '#00ff66')
      if (s10 < 1) lineGrad.addColorStop(Math.min(s10, 0.999), '#ffdd00')
      lineGrad.addColorStop(1, tipMult > 10 ? '#ff3333' : tipMult > 3 ? '#ffdd00' : '#00ff66')
    }

    // Fill under curve
    const fillGrad = ctx.createLinearGradient(x0, 0, xN, 0)
    fillGrad.addColorStop(0, crashed ? 'rgba(102,102,102,0.12)' : 'rgba(0,255,102,0.15)')
    fillGrad.addColorStop(0.5, crashed ? 'rgba(102,102,102,0.05)' : 'rgba(255,221,0,0.07)')
    fillGrad.addColorStop(1, crashed ? 'rgba(255,77,106,0.04)' : 'rgba(255,51,51,0.04)')
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
    ctx.lineWidth = 10
    ctx.globalAlpha = 0.18
    ctx.stroke()
    ctx.globalAlpha = 1

    // Sharp line
    ctx.beginPath()
    ctx.moveTo(projected[0][0], projected[0][1])
    projected.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 3
    ctx.shadowColor = crashed ? '#ff4d6a' : tipMult > 10 ? '#ff3333' : tipMult > 3 ? '#ffdd00' : '#00ff66'
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // Tip dot
    const [ex, ey] = projected[projected.length - 1]
    const tipC = crashed ? '#ff4d6a' : tipMult > 10 ? '#ff3333' : tipMult > 3 ? '#ffdd00' : '#00ff66'
    ctx.beginPath()
    ctx.arc(ex, ey, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = tipC
    ctx.shadowColor = tipC
    ctx.shadowBlur = 18
    ctx.fill()
    ctx.shadowBlur = 0

    // Crash X marker
    if (crashed) {
      ctx.strokeStyle = '#ff4d6a'
      ctx.lineWidth = 3
      ctx.shadowColor = '#ff4d6a'
      ctx.shadowBlur = 20
      const s = 13
      ctx.beginPath()
      ctx.moveTo(ex - s, ey - s)
      ctx.lineTo(ex + s, ey + s)
      ctx.moveTo(ex + s, ey - s)
      ctx.lineTo(ex - s, ey + s)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Cashout avatar markers
    markersRef.current.forEach(m => {
      const [mx, my] = proj(m)
      if (mx < PAD.left - 14 || mx > W + 14) return
      const isHigh = m.mult >= 5
      const borderC = m.isMe ? '#ffffff' : isHigh ? '#ffd700' : '#00ff66'
      const r = 13
      ctx.save()
      ctx.beginPath()
      ctx.arc(mx, my - r - 4, r, 0, Math.PI * 2)
      ctx.fillStyle = avatarColor(m.username)
      ctx.fill()
      ctx.strokeStyle = borderC
      ctx.lineWidth = m.isMe ? 3 : 2
      if (isHigh || m.isMe) {
        ctx.shadowColor = borderC
        ctx.shadowBlur = 8
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.font = 'bold 11px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(m.username[0].toUpperCase(), mx, my - r - 4)
      ctx.font = '10px sans-serif'
      ctx.fillStyle = '#cccccc'
      ctx.textBaseline = 'top'
      ctx.fillText(m.username.slice(0, 9), mx, my + 4)
      ctx.restore()
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      draw(phase === 'CRASHED')
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw, phase])

  useEffect(() => {
    if (phase === 'ACTIVE') {
      activeStartRef.current = performance.now()
      pointsRef.current = []
      scaleRef.current = { maxT: 12, maxMult: 3 }
    }
    if (phase === 'BETTING') {
      pointsRef.current = []
      activeStartRef.current = null
      draw(false)
    }
  }, [phase, draw])

  useEffect(() => {
    if ((phase !== 'ACTIVE' && phase !== 'CRASHED') || !activeStartRef.current) return
    const elapsed = (performance.now() - activeStartRef.current) / 1000
    pointsRef.current.push({ t: elapsed, mult: multiplier })
    if (elapsed > scaleRef.current.maxT * 0.85) scaleRef.current.maxT = elapsed * 1.25
    if (multiplier > scaleRef.current.maxMult * 0.8) scaleRef.current.maxMult = multiplier * 1.35
    draw(phase === 'CRASHED')
  }, [multiplier, phase, draw, cashoutMarkers])

  return <canvas ref={canvasRef} className='w-full h-full block' />
}
