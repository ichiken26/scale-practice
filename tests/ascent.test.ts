import { describe, expect, it } from 'vitest'
import type { ExerciseNote, FretboardNote, ScaleType } from '../src/domain/types'
import { limitToPracticeAscent, planPracticePath, practiceAscentNoteCount } from '../src/domain/practice/ascent'
import { generatePositionFromStartMidi } from '../src/domain/fretboard/positionGenerator'
import { createAscendingExercise, createDescendingExercise } from '../src/domain/practice/pattern'
import { buildExerciseTimeline } from '../src/domain/timeline/timeline'
import { EIGHTH, QUARTER } from '../src/domain/timeline/constants'
import { resolveEnqueueStart } from '../src/audio/practiceAudio'
import { createSeededRng } from '../src/domain/random/rng'
import { generateNextRound, generateRandomPositionRound } from '../src/domain/practice/roundGenerator'
import type { PracticeSettings, RoundGenerationState, ScaleCombination } from '../src/domain/types'

const guitar = [40, 45, 50, 55, 59, 64]
const bass4 = [28, 33, 38, 43]
const diatonic: ScaleType[] = ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor']
const pentatonic: ScaleType[] = ['majorPentatonic', 'minorPentatonic']

function phrase(count: number, midiStart = 48): ExerciseNote[] {
  return Array.from({ length: count }, (_, index) => ({
    sourceIndex: index,
    note: { stringIndex: Math.min(5, Math.floor(index / 3)), fret: index, midi: midiStart + index, pitchClass: (midiStart + index) % 12 as FretboardNote['pitchClass'], scaleDegree: (index % 7) + 1 },
  }))
}

function stringCounts(notes: readonly { note: FretboardNote }[], stringCount: number): number[] {
  const counts = Array.from({ length: stringCount }, () => 0)
  for (const item of notes) {
    const stringIndex = item.note.stringIndex
    counts[stringIndex] = (counts[stringIndex] ?? 0) + 1
  }
  return counts
}

describe('practice ascent length', () => {
  it('uses every string in a strict notes-per-string box', () => {
    for (const scaleType of diatonic) expect(practiceAscentNoteCount(scaleType, 6)).toBe(18)
    for (const scaleType of pentatonic) expect(practiceAscentNoteCount(scaleType, 6)).toBe(12)
  })

  it('keeps four bass strings at three notes and one string at the minimum box', () => {
    expect(practiceAscentNoteCount('major', 4)).toBe(12)
    expect(practiceAscentNoteCount('minorPentatonic', 4)).toBe(8)
    expect(practiceAscentNoteCount('major', 1)).toBe(3)
  })

  it('rejects a non-positive string count', () => {
    expect(() => practiceAscentNoteCount('major', 0)).toThrow(RangeError)
    expect(() => limitToPracticeAscent([], 'major', 0)).toThrow(RangeError)
  })
})

describe('boxed ascent trimming', () => {
  it('keeps all six strings of a guitar major position', () => {
    const position = generatePositionFromStartMidi({ tuning: guitar, root: 0, scaleType: 'major', startMidi: 48 })
    const limited = limitToPracticeAscent(position?.ascendingPath ?? [], 'major', 6)
    expect(limited).toHaveLength(18)
    expect(new Set(limited.map(note => note.stringIndex))).toEqual(new Set([0, 1, 2, 3, 4, 5]))
  })

  it('returns an empty path unchanged and leaves non-boxed paths intact', () => {
    expect(limitToPracticeAscent([], 'major', 6)).toEqual([])
    const partial = phrase(4).map(item => item.note)
    expect(limitToPracticeAscent(partial, 'major', 6)).toEqual(partial)
  })

  it('rejects a boxed count that skips a string', () => {
    const notes = Array.from({ length: 18 }, (_, index) => ({ stringIndex: 0, fret: index, midi: 40 + index, pitchClass: (40 + index) % 12 as FretboardNote['pitchClass'], scaleDegree: 1 }))
    expect(() => limitToPracticeAscent(notes, 'major', 6)).toThrow(RangeError)
  })
})

describe('straight scale run', () => {
  it('does not hold past a quarter note and turns around on the next eighth', () => {
    const notes = Array.from({ length: 18 }, (_, index) => ({ stringIndex: Math.floor(index / 3), fret: index, midi: 48 + index, pitchClass: (48 + index) % 12 as FretboardNote['pitchClass'], scaleDegree: (index % 7) + 1 }))
    const timeline = buildExerciseTimeline({ ascending: createAscendingExercise(notes, 'normal'), descending: createDescendingExercise(notes, 'normal'), exerciseType: 'normal' })
    const musical = timeline.events.filter(event => event.type === 'note')
    expect(musical.every(event => event.durationTicks <= QUARTER)).toBe(true)
    expect(timeline.descendingStartTick - (musical[17]?.tick ?? 0)).toBe(EIGHTH)
    const landing = buildExerciseTimeline({ ascending: createAscendingExercise(notes.slice(0, 7), 'normal'), descending: [], exerciseType: 'normal' })
    expect(landing.events.filter(event => event.type === 'note').at(-1)?.durationTicks).toBe(QUARTER)
  })
})

describe('planned scale run', () => {
  it('ascends a guitar major position across every string and comes straight back down', () => {
    const position = generatePositionFromStartMidi({ tuning: guitar, root: 0, scaleType: 'major', startMidi: 48 })
    const planned = planPracticePath({ notes: position?.ascendingPath ?? [], scaleType: 'major', tuning: guitar, root: 0, exerciseType: 'normal' })
    expect(planned.ascending).toHaveLength(18)
    expect(stringCounts(planned.ascending, 6)).toEqual([3, 3, 3, 3, 3, 3])
    expect(planned.ascending.slice(1).every((item, index) => item.note.midi > (planned.ascending[index]?.note.midi ?? 0))).toBe(true)
    expect(planned.descending.map(item => item.note.midi)).toEqual([...planned.ascending].reverse().map(item => item.note.midi))
  })

  it('plays a 4-string major box with three notes on every string', () => {
    const position = generatePositionFromStartMidi({ tuning: bass4, root: 0, scaleType: 'major', startMidi: 36 })
    expect(position).not.toBeNull()
    const planned = planPracticePath({ notes: position?.ascendingPath ?? [], scaleType: 'major', tuning: bass4, root: 0, exerciseType: 'normal' })
    expect(planned.ascending).toHaveLength(12)
    expect(stringCounts(planned.ascending, 4)).toEqual([3, 3, 3, 3])
    expect(planned.descending[0]?.note.midi).toBe(planned.ascending.at(-1)?.note.midi)
  })

  it('rejects an empty tuning and accepts an empty note list', () => {
    expect(() => planPracticePath({ notes: [], scaleType: 'major', tuning: [], root: 0, exerciseType: 'normal' })).toThrow(RangeError)
    expect(planPracticePath({ notes: [], scaleType: 'major', tuning: guitar, root: 0, exerciseType: 'normal' })).toEqual({ displayNotes: [], ascending: [], descending: [] })
  })
})

describe('enqueue scheduling', () => {
  it('keeps a future scale start on its absolute time', () => {
    expect(resolveEnqueueStart(10, 3)).toBe(10)
  })

  it('bumps a start that has already reached the audio clock', () => {
    expect(resolveEnqueueStart(3, 3)).toBeCloseTo(3.05)
    expect(resolveEnqueueStart(3, 3.2)).toBeCloseTo(3.25)
  })

  it('rejects non-finite times', () => {
    expect(() => resolveEnqueueStart(Number.NaN, 0)).toThrow(RangeError)
    expect(() => resolveEnqueueStart(1, Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('continuous redraw', () => {
  const settings = (): PracticeSettings => ({ instrument: 'guitar', tuning: guitar, root: 0, scaleType: 'major', exerciseType: 'normal', mode: 'randomPosition', bpm: 100, seed: 9 })

  it('keeps eighth-note attacks and quarter-note maximums across successive draws', () => {
    const state: RoundGenerationState = { scaleBag: [], previousCombination: null, positionBags: new Map() }
    const rng = createSeededRng(9)
    let previous: ScaleCombination | null = null
    for (let index = 0; index < 12; index++) {
      const drawn = generateNextRound({ settings: settings(), rng, state, previousCombination: previous })
      const notes = drawn.timeline.events.filter(event => event.type === 'note')
      expect(notes.length).toBeGreaterThan(0)
      expect(notes.every(event => event.durationTicks <= QUARTER)).toBe(true)
      for (let noteIndex = 1; noteIndex < notes.length; noteIndex++) {
        expect((notes[noteIndex]?.tick ?? 0) - (notes[noteIndex - 1]?.tick ?? 0)).toBe(EIGHTH)
      }
      previous = drawn.combination
    }
    expect(generateRandomPositionRound({ settings: settings(), rng: createSeededRng(9) }).timeline.totalTicks).toBeGreaterThan(0)
  })
})
