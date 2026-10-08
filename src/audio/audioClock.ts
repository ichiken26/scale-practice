import type { AudioClockSnapshot, ExerciseTimeline, VisualTimelineState } from '../domain/types'

function finiteLatency(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

export function getClockSnapshot(audioContext: AudioContext): AudioClockSnapshot {
  const performanceNow = performance.now()
  const timestamp = audioContext.getOutputTimestamp?.()
  const hasOutputTimestamp = timestamp !== undefined
    && Number.isFinite(timestamp.contextTime)
    && Number.isFinite(timestamp.performanceTime)

  return {
    contextTime: hasOutputTimestamp ? timestamp.contextTime : audioContext.currentTime,
    performanceTime: hasOutputTimestamp ? timestamp.performanceTime : performanceNow,
    baseLatency: finiteLatency('baseLatency' in audioContext ? audioContext.baseLatency : 0),
    outputLatency: finiteLatency('outputLatency' in audioContext ? audioContext.outputLatency : 0),
    usesOutputTimestamp: hasOutputTimestamp,
  }
}

export function estimateAudibleContextTime(snapshot: AudioClockSnapshot, performanceNow: number): number {
  const mappedContextTime = snapshot.contextTime + (performanceNow - snapshot.performanceTime) / 1000

  // getOutputTimestamp() already maps the context timeline to the sample frame at the
  // physical output device. Adding outputLatency again would double-compensate it.
  if (snapshot.usesOutputTimestamp) return mappedContextTime

  // currentTime is ahead of what is physically audible. On the fallback path, account
  // for both graph-to-host and host-to-device latency instead of advancing the visual.
  return Math.max(0, mappedContextTime - snapshot.baseLatency - snapshot.outputLatency)
}

export function timelineTickAtContextTime(contextTime: number, sessionStart: number, bpm: number): number {
  if (bpm <= 0) throw new RangeError('bpm must be positive')
  return (contextTime - sessionStart) * bpm / 60 * 960
}

export function getVisualStateAtTick(timeline: ExerciseTimeline, tick: number): VisualTimelineState {
  const musical = timeline.events.filter(event => event.type === 'note')
  let index = -1
  for (let current = 0; current < musical.length; current += 1) {
    if ((musical[current] as typeof musical[number]).tick <= tick) index = current
  }
  const current = index >= 0 ? (musical[index] ?? null) : null
  const next = musical[index + 1] ?? null
  const progress = current
    ? Math.max(0, Math.min(1, (tick - current.tick) / Math.max(1, current.durationTicks)))
    : 0
  return { currentEvent: current, nextEvent: next, eventIndex: index, progress }
}
