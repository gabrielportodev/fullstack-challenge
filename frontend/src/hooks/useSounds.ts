'use client'

import { useCallback, useRef } from 'react'

export type SoundName = 'bet' | 'cashout' | 'crash' | 'bettingStart' | 'roundStart'

export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback((sound: SoundName) => {
    if (typeof window === 'undefined') return
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const tone = (
        type: OscillatorType,
        startFreq: number,
        endFreq: number,
        startGain: number,
        duration: number,
        offset = 0,
        filter?: BiquadFilterNode
      ) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const t = ctx.currentTime + offset
        osc.type = type
        osc.frequency.setValueAtTime(startFreq, t)
        if (endFreq !== startFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration)
        gain.gain.setValueAtTime(startGain, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
        osc.connect(filter ?? gain)
        if (filter) filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + duration)
      }

      switch (sound) {
        case 'bet':
          tone('square', 880, 440, 0.12, 0.08)
          break
        case 'cashout':
          ;[523, 659, 784].forEach((freq, i) => tone('sine', freq, freq, 0.22, 0.28, i * 0.09))
          break
        case 'crash': {
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.value = 900
          tone('sawtooth', 240, 35, 0.35, 0.7, 0, filter)
          break
        }
        case 'bettingStart':
          ;[392, 523].forEach((freq, i) => tone('sine', freq, freq, 0.1, 0.3, i * 0.13))
          break
        case 'roundStart':
          tone('sine', 200, 620, 0.18, 0.28)
          break
      }
    } catch {}
  }, [])

  return { play }
}
