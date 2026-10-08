import type { AudioClockSnapshot, ExerciseTimeline, TimelineEvent, VisualTimelineState } from '../domain/types'

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

function upperBoundByTick(events: readonly TimelineEvent[], tick: number): number {
  let low = 0
  let high = events.length
  while (low < high) {
    const middle = (low + high) >>> 1
    const event = events[middle]
    if (event && event.tick <= tick) low = middle + 1
    else high = middle
  }
  return low
}

function findPreviousNote(events: readonly TimelineEvent[], fromExclusive: number): number {
  for (let index = fromExclusive - 1; index >= 0; index -= 1) {
    if (events[index]?.type === 'note') return index
  }
  return -1
}

function findNextNote(events: readonly TimelineEvent[], fromInclusive: number): number {
  for (let index = fromInclusive; index < events.length; index += 1) {
    if (events[index]?.type === 'note') return index
  }
  return -1
}

export function getVisualStateAtTick(timeline: ExerciseTimeline, tick: number): VisualTimelineState {
  const insertion = upperBoundByTick(timeline.events, tick)
  const previousNoteIndex = findPreviousNote(timeline.events, insertion)
  const previous = previousNoteIndex >= 0 ? timeline.events[previousNoteIndex] ?? null : null
  const current = previous && tick < previous.tick + previous.durationTicks ? previous : null
  const nextSearchStart = current ? previousNoteIndex + 1 : insertion
  const nextNoteIndex = findNextNote(timeline.events, nextSearchStart)
  const next = nextNoteIndex >= 0 ? timeline.events[nextNoteIndex] ?? null : null
  const progress = current
    ? Math.max(0, Math.min(1, (tick - current.tick) / Math.max(1, current.durationTicks)))
    : 0
  return { currentEvent: current, nextEvent: next, eventIndex: current ? previousNoteIndex : -1, progress }
}
