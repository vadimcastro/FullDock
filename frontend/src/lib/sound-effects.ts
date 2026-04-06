'use client'

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }
  return audioContext
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain()
    // Keep interaction sounds clearly audible across repeated actions.
    masterGain.gain.value = 1
    masterGain.connect(ctx.destination)
  }
  return masterGain
}

function playTone(
  fromHz: number,
  toHz: number,
  duration = 0.14,
  volume = 0.06,
  type: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const start = () => {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(fromHz, now)
    osc.frequency.exponentialRampToValueAtTime(toHz, now + duration)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.008)
    gain.gain.linearRampToValueAtTime(0.0001, now + duration)

    const out = getMasterGain(ctx)
    osc.connect(gain)
    gain.connect(out)
    osc.start(now)
    osc.stop(now + duration + 0.01)
  }

  if (ctx.state === 'suspended') {
    void ctx.resume().then(start).catch(() => {})
    return
  }

  start()
}

export function playUiClickSound(): void {
  // Neutral click: A5 -> E5
  playTone(880, 659.25, 0.14, 0.12, 'sine')
}

export function playUiTabSwitchSound(): void {
  // Soft but audible switch cue: E5 -> A5
  playTone(659.25, 880, 0.13, 0.12, 'triangle')
}

export function playUiCopySound(): void {
  // Confirmation chirp: C6 -> E6
  playTone(1046.5, 1318.51, 0.12, 0.115, 'triangle')
}

export function playUiCompleteSound(): void {
  // Positive cue: G4 -> B4
  playTone(392, 493.88, 0.16, 0.13, 'sine')
}

export function playUiNeedsEditSound(): void {
  // Gentle warning cue: F4 -> D4
  playTone(349.23, 293.66, 0.16, 0.12, 'triangle')
}

export function playUiDeleteSound(): void {
  // Soft down cue for destructive action: D4 -> A3
  playTone(293.66, 220, 0.2, 0.135, 'triangle')
}

export function playUiRetrySound(): void {
  // Distinct "retry" cue: D5 -> F5
  playTone(587.33, 698.46, 0.14, 0.13, 'sine')
}
