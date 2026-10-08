import { describe, expect, it } from 'vitest'
import { alignTickToNextBar, buildExerciseTimeline, ticksPerExerciseNote, tickToContextTime, timelineDurationSeconds } from '../src/domain/timeline/timeline'
import { BAR_4_4, EIGHTH, PPQN, QUARTER, QUARTER_TRIPLET } from '../src/domain/timeline/constants'
import { createAscendingExercise, createDescendingExercise } from '../src/domain/practice/pattern'
import { createSeededRng } from '../src/domain/random/rng'
import { generateFullNeckRound, generateNextRound, generateRandomPositionRound } from '../src/domain/practice/roundGenerator'
import { createKarplusStrongVoice, getSynthParameters } from '../src/audio/dsp/karplusStrong'
import { estimateAudibleContextTime, getClockSnapshot, getVisualStateAtTick, timelineTickAtContextTime } from '../src/audio/audioClock'
import { calculateTimingStats, createTimingRecorder, recordTimingSample } from '../src/debug/timingRecorder'
import type { FretboardNote, PracticeSettings, TimingSample } from '../src/domain/types'

const notes = Array.from({ length: 8 }, (_, index) => ({
  stringIndex: Math.min(5, Math.floor(index / 2)),
  fret: index,
  midi: 48 + index,
  pitchClass: (48 + index) % 12,
  scaleDegree: index % 7 + 1,
} as FretboardNote))

describe('tick timeline', () => {
  it('defines exact PPQN constants and pattern durations', () => {
    expect([PPQN, QUARTER, EIGHTH, QUARTER_TRIPLET, BAR_4_4]).toEqual([960, 960, 480, 640, 3840])
    expect(ticksPerExerciseNote('normal')).toBe(EIGHTH)
    expect(ticksPerExerciseNote('threeNote')).toBe(QUARTER_TRIPLET)
    expect(ticksPerExerciseNote('fourNote')).toBe(EIGHTH)
  })

  it('shows the selected scale immediately, then counts eight beats before playing', () => {
    const timeline = buildExerciseTimeline({
      ascending: createAscendingExercise(notes, 'normal'),
      descending: createDescendingExercise(notes, 'normal'),
      exerciseType: 'normal',
    })
    const announcement = timeline.events.find(event => event.type === 'announcement')
    const preview = timeline.events.find(event => event.type === 'preview')
    const firstNote = timeline.events.find(event => event.type === 'note')
    expect(announcement).toBeUndefined()
    expect(preview).toMatchObject({ tick: 0, durationTicks: BAR_4_4 * 2 })
    expect(firstNote?.tick).toBe(BAR_4_4 * 2)
  })

  it('turns Normal around immediately and re-attacks the apex', () => {
    const oddNotes = notes.slice(0, 7)
    const ascending = createAscendingExercise(oddNotes, 'normal')
    const descending = createDescendingExercise(oddNotes, 'normal')
    const timeline = buildExerciseTimeline({
      ascending,
      descending,
      exerciseType: 'normal',
    })
    const previewTicks = BAR_4_4 * 2
    expect(timeline.descendingStartTick).toBe(previewTicks + ascending.length * EIGHTH)
    expect(timeline.descendingStartTick).toBe(timeline.ascendingEndTick)

    const musical = timeline.events.filter(event => event.type === 'note')
    const ascendingLast = musical[ascending.length - 1]
    expect(ascendingLast?.durationTicks).toBe(Math.round(EIGHTH * 0.8))
    expect(musical[ascending.length]?.midi).toBe(oddNotes.at(-1)?.midi)
    expect(musical[ascending.length + 1]?.midi).toBe(oddNotes.at(-2)?.midi)
  })

  it('keeps three-note turnaround bar-aligned', () => {
    const oddNotes = notes.slice(0, 7)
    const ascending = createAscendingExercise(oddNotes, 'threeNote')
    const timeline = buildExerciseTimeline({
      ascending,
      descending: createDescendingExercise(oddNotes, 'threeNote'),
      exerciseType: 'threeNote',
    })
    expect(timeline.descendingStartTick).toBeGreaterThanOrEqual(timeline.ascendingEndTick)
    expect(timeline.descendingStartTick % BAR_4_4).toBe(0)
    const musical = timeline.events.filter(event => event.type === 'note')
    const ascendingLast = musical[ascending.length - 1]
    expect((ascendingLast?.tick ?? 0) + (ascendingLast?.durationTicks ?? 0)).toBe(timeline.descendingStartTick)
  })

  it('turns four-note patterns around immediately and re-attacks the apex', () => {
    const oddNotes = notes.slice(0, 7)
    const ascending = createAscendingExercise(oddNotes, 'fourNote')
    const descending = createDescendingExercise(oddNotes, 'fourNote')
    const timeline = buildExerciseTimeline({
      ascending,
      descending,
      exerciseType: 'fourNote',
    })
    const previewTicks = BAR_4_4 * 2
    expect(timeline.descendingStartTick).toBe(previewTicks + ascending.length * EIGHTH)
    expect(timeline.descendingStartTick).toBe(timeline.ascendingEndTick)

    const musical = timeline.events.filter(event => event.type === 'note')
    const ascendingLast = musical[ascending.length - 1]
    expect(ascendingLast?.durationTicks).toBe(Math.round(EIGHTH * 0.8))
    expect(musical[ascending.length]?.tick).toBe(timeline.descendingStartTick)
    expect(musical[ascending.length]?.midi).toBe(oddNotes.at(-1)?.midi)
  })

  it('hands Normal off on the final descending attack instead of adding bar padding', () => {
    const timeline = buildExerciseTimeline({
      ascending: createAscendingExercise(notes.slice(0, 7), 'normal'),
      descending: createDescendingExercise(notes.slice(0, 7), 'normal'),
      exerciseType: 'normal',
    })
    const lastPhraseNote = timeline.events.filter(event => event.type === 'note').at(-1)
    expect(lastPhraseNote?.tick).toBe(timeline.totalTicks)
  })

  it('keeps three-note phrase endings bar-aligned', () => {
    const timeline = buildExerciseTimeline({
      ascending: createAscendingExercise(notes.slice(0, 7), 'threeNote'),
      descending: createDescendingExercise(notes.slice(0, 7), 'threeNote'),
      exerciseType: 'threeNote',
    })
    expect(timeline.totalTicks % BAR_4_4).toBe(0)
    const lastPhraseNote = timeline.events.filter(event => event.type === 'note').at(-1)
    expect((lastPhraseNote?.tick ?? 0) + (lastPhraseNote?.durationTicks ?? 0)).toBe(timeline.totalTicks)
  })

  it('derives absolute context time without accumulation at BPM boundaries', () => {
    for (const bpm of [40, 100, 220]) {
      expect(tickToContextTime(960_000, bpm, 2)).toBe(2 + 1000 * 60 / bpm)
    }
    expect(timelineDurationSeconds(3840, 120)).toBe(2)
    expect(alignTickToNextBar(3841)).toBe(7680)
  })

  it('rejects invalid time input', () => {
    expect(() => tickToContextTime(1, 0, 0)).toThrow()
    expect(() => alignTickToNextBar(-1)).toThrow()
  })
})

const settings = (mode: 'randomPosition' | 'fullNeck' = 'randomPosition'): PracticeSettings => ({
  instrument: 'guitar',
  tuning: [40, 45, 50, 55, 59, 64],
  root: 0,
  scaleType: 'major',
  exerciseType: 'normal',
  mode,
  bpm: 100,
  seed: 77,
})

describe('round generation integration', () => {
  it('starts the eight-count handoff on the final Normal landing attack', () => {
    const a = generateRandomPositionRound({ settings: settings(), rng: createSeededRng(77) })
    const b = generateNextRound({ settings: settings(), rng: createSeededRng(77) })
    expect(a).toEqual(b)
    expect(a.paths).toHaveLength(1)

    const notesOnly = a.timeline.events.filter(event => event.type === 'note')
    const landing = notesOnly.at(-1)
    expect(landing?.tick).toBe(a.timeline.totalTicks)
    expect(landing?.durationTicks).toBe(BAR_4_4)
    expect(landing?.pathIndex).toBe(0)
  })

  it('keeps Full Neck path selection exact and leaves exactly eight beats after each Normal landing', () => {
    const round = generateFullNeckRound({ settings: settings('fullNeck'), rng: createSeededRng(77) })
    expect(round.paths.length).toBeGreaterThan(3)
    const noteEvents = round.timeline.events.filter(event => event.type === 'note')
    expect(noteEvents.every(event => typeof event.pathIndex === 'number')).toBe(true)

    for (let index = 0; index < round.paths.length; index += 1) {
      const pathEvents = noteEvents.filter(event => event.pathIndex === index)
      expect(pathEvents.length).toBeGreaterThan(0)
      const landing = pathEvents.at(-1)
      expect(landing?.durationTicks).toBe(BAR_4_4)

      if (index < round.paths.length - 1) {
        const nextPathFirst = noteEvents.find(event => event.pathIndex === index + 1)
        expect((nextPathFirst?.tick ?? 0) - (landing?.tick ?? 0)).toBe(BAR_4_4 * 2)
      }
    }

    const finalLanding = noteEvents.at(-1)
    expect(finalLanding?.tick).toBe(round.timeline.totalTicks)
    expect(finalLanding?.pathIndex).toBe(round.paths.length - 1)
  })

  it.each([
    [[38, 45, 50, 55, 59, 64]],
    [[35, 40, 45, 50, 55, 59, 64]],
    [[28, 33, 38, 43]],
    [[23, 28, 33, 38, 43]],
    [[23, 28, 33, 38, 43, 48]],
  ])('supports required tuning %j', tuning => {
    const current = { ...settings(), tuning }
    expect(generateNextRound({ settings: current, rng: createSeededRng(4) }).paths[0]?.notes.length).toBeGreaterThan(0)
  })
})

describe('reference DSP', () => {
  it('uses different guitar and bass parameters', () => {
    expect(getSynthParameters('guitar')).not.toEqual(getSynthParameters('bass'))
  })

  it.each([28, 40, 69])('stays finite for MIDI %s', midi => {
    const voice = createKarplusStrongVoice({ midi, sampleRate: 48000, instrument: midi < 40 ? 'bass' : 'guitar', seed: 1 })
    for (let index = 0; index < 10000; index += 1) expect(Number.isFinite(voice.processSample())).toBe(true)
  })

  it('eventually finishes and rejects invalid sample rate', () => {
    const voice = createKarplusStrongVoice({ midi: 100, sampleRate: 1000, instrument: 'guitar' })
    for (let index = 0; index < 5000; index += 1) voice.processSample()
    expect(voice.isFinished()).toBe(true)
    expect(() => createKarplusStrongVoice({ midi: 40, sampleRate: 0, instrument: 'bass' })).toThrow()
  })
})

describe('clock and timing diagnostics', () => {
  it('uses getOutputTimestamp without double-counting output latency', () => {
    const context = {
      currentTime: 4,
      baseLatency: 0.02,
      outputLatency: 0.1,
      getOutputTimestamp: () => ({ contextTime: 3, performanceTime: 1000 }),
    } as AudioContext
    const snapshot = getClockSnapshot(context)
    expect(snapshot.usesOutputTimestamp).toBe(true)
    expect(estimateAudibleContextTime(snapshot, 1500)).toBe(3.5)
    expect(timelineTickAtContextTime(2, 1, 120)).toBe(1920)
  })

  it('falls back to currentTime minus reported pipeline latency', () => {
    const old = globalThis.performance
    Object.defineProperty(globalThis, 'performance', { value: { now: () => 2000 }, configurable: true })
    const snapshot = getClockSnapshot({
      currentTime: 4,
      baseLatency: 0.02,
      outputLatency: 0.03,
    } as AudioContext)
    expect(snapshot).toEqual({
      contextTime: 4,
      performanceTime: 2000,
      baseLatency: 0.02,
      outputLatency: 0.03,
      usesOutputTimestamp: false,
    })
    expect(estimateAudibleContextTime(snapshot, 2000)).toBeCloseTo(3.95)
    Object.defineProperty(globalThis, 'performance', { value: old, configurable: true })
  })

  it('does not keep a stale current note during a rest and exposes the exact next path', () => {
    const timeline = {
      events: [
        { tick: 0, durationTicks: 100, type: 'note' as const, pathIndex: 0 },
        { tick: 1000, durationTicks: 100, type: 'note' as const, pathIndex: 1 },
      ],
      totalTicks: 2000,
      ascendingEndTick: 0,
      descendingStartTick: 0,
    }
    const sounding = getVisualStateAtTick(timeline, 50)
    expect(sounding.currentEvent?.pathIndex).toBe(0)
    const rest = getVisualStateAtTick(timeline, 500)
    expect(rest.currentEvent).toBeNull()
    expect(rest.nextEvent?.pathIndex).toBe(1)
  })

  it('recomputes visual state after arbitrary frame jumps', () => {
    const timeline = buildExerciseTimeline({
      ascending: createAscendingExercise(notes, 'normal'),
      descending: createDescendingExercise(notes, 'normal'),
      exerciseType: 'normal',
    })
    expect(getVisualStateAtTick(timeline, 0).eventIndex).toBe(-1)
    expect(getVisualStateAtTick(timeline, BAR_4_4 * 2 + 1200).eventIndex).toBeGreaterThanOrEqual(1)
  })

  it('computes absolute timing percentiles and recorder limits', () => {
    const sample = (deviation: number): TimingSample => ({
      expectedTime: 0,
      audioContextTime: 0,
      outputContextTime: 0,
      performanceTime: 0,
      estimatedAudibleTime: 0,
      visualTarget: 0,
      visualActual: 0,
      deviation,
      droppedFrames: 0,
      audioContextState: 'running',
    })
    const samples = [sample(-0.01), sample(0.02), sample(0.03), sample(0.1)]
    expect(calculateTimingStats(samples)).toEqual({ count: 4, max: 0.1, mean: 0.04, p95: 0.1, p99: 0.1 })
    const recorder = createTimingRecorder(2)
    samples.forEach(value => recorder.record(value))
    expect(recorder.samples()).toHaveLength(2)
    recorder.clear()
    expect(recorder.stats().count).toBe(0)
    expect(() => recordTimingSample([], sample(Infinity))).toThrow()
    expect(() => createTimingRecorder(0)).toThrow()
  })
})
