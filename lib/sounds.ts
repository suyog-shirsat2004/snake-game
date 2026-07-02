let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === "suspended") ctx.resume()
  return ctx
}

export function playEat() {
  const c = getCtx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "square"
  osc.frequency.setValueAtTime(500, now)
  osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08)
  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.15)
}

export function playGameOver() {
  const c = getCtx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "sawtooth"
  osc.frequency.setValueAtTime(350, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.6)
  gain.gain.setValueAtTime(0.06, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.6)
}

export function playLevelUp() {
  const c = getCtx()
  const now = c.currentTime
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const t = now + i * 0.1
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = "square"
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.07, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.18)
  })
}

export function playStart() {
  const c = getCtx()
  const now = c.currentTime
  const notes = [440, 554, 659]
  notes.forEach((freq, i) => {
    const t = now + i * 0.09
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = "square"
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.07, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.2)
  })
}

export function playPause() {
  const c = getCtx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "square"
  osc.frequency.setValueAtTime(280, now)
  gain.gain.setValueAtTime(0.05, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.06)
}

export function playResume() {
  const c = getCtx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "square"
  osc.frequency.setValueAtTime(500, now)
  gain.gain.setValueAtTime(0.05, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.06)
}
