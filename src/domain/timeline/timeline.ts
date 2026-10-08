import type { BuildExerciseTimelineParams, ExerciseNote, ExerciseTimeline, ExerciseType, TimelineEvent } from '../types'
import { BAR_4_4, EIGHTH, QUARTER, QUARTER_TRIPLET } from './constants'

const SOUNDED_SLOT_RATIO = 0.8
const METRONOME_SPACING = QUARTER
const CLICK_TICKS = 120

export function ticksPerExerciseNote(exercise: ExerciseType): number {
  return exercise === 'threeNote' ? QUARTER_TRIPLET : EIGHTH
}

export function alignTickToNextBar(tick: number): number {
  if (!Number.isFinite(tick) || tick < 0) throw new RangeError('tick must be non-negative')
  return Math.ceil(tick / BAR_4_4) * BAR_4_4
}

function pushNote(events: TimelineEvent[], tick: number, step: number, item: ExerciseNote): void {
  events.push({ tick, durationTicks: Math.round(step * SOUNDED_SLOT_RATIO), type: 'note', midi: item.note.midi, note: item.note })
}

/** A landing may absorb one leftover subdivision, and never grows past a quarter note. */
function holdLanding(events: TimelineEvent[], phraseEndTick: number): void {
  const bar = alignTickToNextBar(phraseEndTick)
  const gap = bar - phraseEndTick
  if (gap <= 0) return
  const last = [...events].reverse().find(event => event.type === 'note' && event.tick < phraseEndTick)
  if (!last) return
  const untilBar = bar - last.tick
  if (untilBar <= 0 || untilBar > QUARTER) return
  last.durationTicks = untilBar
}

export function buildExerciseTimeline(params: BuildExerciseTimelineParams): ExerciseTimeline {
  const step = ticksPerExerciseNote(params.exerciseType)
  const events: TimelineEvent[] = []
  const preview = (params.previewBars ?? 1) * BAR_4_4
  const gap = (params.gapBars ?? 0) * BAR_4_4
  if (preview > 0) {
    events.push({ tick: 0, durationTicks: preview, type: 'announcement' })
    events.push({ tick: 0, durationTicks: preview, type: 'preview' })
  }
  let tick = preview
  for (const item of params.ascending) {
    pushNote(events, tick, step, item)
    tick += step
  }
  const ascendingEndTick = tick
  const descendingStartTick = tick + gap
  tick = descendingStartTick
  for (const item of params.descending) {
    pushNote(events, tick, step, item)
    tick += step
  }
  holdLanding(events, tick)
  const totalTicks = alignTickToNextBar(tick)
  for (let beat = 0; beat < totalTicks; beat += METRONOME_SPACING) {
    events.push({ tick: beat, durationTicks: CLICK_TICKS, type: 'metronome', accent: beat % BAR_4_4 === 0 })
  }
  return {
    events: events.sort((a, b) => a.tick - b.tick || (a.type === 'metronome' ? -1 : 1)),
    totalTicks,
    ascendingEndTick,
    descendingStartTick,
  }
}

export function tickToContextTime(tick: number, bpm: number, sessionStartContextTime: number): number {
  if (!Number.isFinite(tick) || !Number.isFinite(bpm) || bpm <= 0) throw new RangeError('tick must be finite and bpm positive')
  return sessionStartContextTime + tick / 960 * 60 / bpm
}

export function timelineDurationSeconds(totalTicks: number, bpm: number): number {
  return tickToContextTime(totalTicks, bpm, 0)
}
