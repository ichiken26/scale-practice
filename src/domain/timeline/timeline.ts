import type { BuildExerciseTimelineParams, ExerciseNote, ExerciseTimeline, ExerciseType, TimelineEvent } from '../types'
import { BAR_4_4, EIGHTH, QUARTER, QUARTER_TRIPLET } from './constants'

const SOUNDED_SLOT_RATIO = 0.8
const METRONOME_SPACING = QUARTER
const CLICK_TICKS = 120
const DEFAULT_ANNOUNCEMENT_BARS = 0
const DEFAULT_PREVIEW_BARS = 2

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

function extendLastNoteTo(events: TimelineEvent[], targetTick: number): void {
  const last = [...events].reverse().find(event => event.type === 'note' && event.tick < targetTick)
  if (!last) return
  const duration = targetTick - last.tick
  if (duration > 0) last.durationTicks = duration
}

export function buildExerciseTimeline(params: BuildExerciseTimelineParams): ExerciseTimeline {
  const step = ticksPerExerciseNote(params.exerciseType)
  const events: TimelineEvent[] = []
  const announcement = (params.announcementBars ?? DEFAULT_ANNOUNCEMENT_BARS) * BAR_4_4
  const preview = (params.previewBars ?? DEFAULT_PREVIEW_BARS) * BAR_4_4
  const gap = (params.gapBars ?? 0) * BAR_4_4

  if (announcement > 0) {
    events.push({ tick: 0, durationTicks: announcement, type: 'announcement' })
  }
  if (preview > 0) {
    events.push({ tick: announcement, durationTicks: preview, type: 'preview' })
  }

  let tick = announcement + preview
  for (const item of params.ascending) {
    pushNote(events, tick, step, item)
    tick += step
  }

  const ascendingEndTick = tick
  const shouldTurnImmediately = params.exerciseType !== 'threeNote'
  const descendingStartTick = (shouldTurnImmediately ? ascendingEndTick : alignTickToNextBar(ascendingEndTick)) + gap
  if (!shouldTurnImmediately) extendLastNoteTo(events, descendingStartTick)

  tick = descendingStartTick
  for (const item of params.descending) {
    pushNote(events, tick, step, item)
    tick += step
  }

  // Normal / 4-note hand off at the onset of the final descending note.
  // This lets the following two-bar transition be exactly eight beats from
  // the final attack, with the landing note itself sustained across bar one.
  const lastNote = [...events].reverse().find(event => event.type === 'note')
  const totalTicks = params.exerciseType === 'threeNote'
    ? alignTickToNextBar(tick)
    : lastNote?.tick ?? tick

  if (params.exerciseType === 'threeNote') extendLastNoteTo(events, totalTicks)

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
