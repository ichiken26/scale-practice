import { describe, expect, it } from 'vitest'
import { createSeededRng, randomSeed, shuffleSeeded } from '../src/domain/random/rng'
import { GENERAL_GUITAR_BASS_WEIGHTS, getScaleWeight } from '../src/domain/practice/scaleWeights'
import {
  buildSequentialScaleCycle,
  buildWeightedScaleBag,
  preventBoundaryDuplicate,
  shuffleScaleBag,
} from '../src/domain/practice/weightedBag'
import { createPositionBag, createPositionBagKey, drawPosition, refillPositionBag } from '../src/domain/practice/positionBag'
import { createAscendingExercise, createDescendingExercise, createNormalPattern, createSlidingWindowPattern } from '../src/domain/practice/pattern'
import { planPracticePath } from '../src/domain/practice/ascent'
import type { FretboardNote, FretboardPosition } from '../src/domain/types'

describe('seeded random', () => {
  it('repeats sequence and bounded integers', () => {
    const a = createSeededRng(5)
    const b = createSeededRng(5)
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()))
    expect(createSeededRng(6).next()).not.toBe(createSeededRng(5).next())
    expect(createSeededRng(1).nextInt(2)).toBeGreaterThanOrEqual(0)
  })

  it('shuffles without mutating input', () => {
    const source = [1, 2, 3, 4]
    const result = shuffleSeeded(source, createSeededRng(1))
    expect(source).toEqual([1, 2, 3, 4])
    expect(result.sort()).toEqual(source)
  })

  it('rejects invalid random input and creates a uint seed', () => {
    expect(() => createSeededRng(1.2)).toThrow()
    expect(() => createSeededRng(1).nextInt(0)).toThrow()
    expect(randomSeed()).toBeGreaterThanOrEqual(0)
  })
})

describe('scale selection bags', () => {
  it('cycles a fixed scale chromatically from A through G#', () => {
    const cycle = buildSequentialScaleCycle('major')
    expect(cycle.map(item => item.root)).toEqual([9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(cycle.every(item => item.scaleType === 'major')).toBe(true)
  })

  it('builds 72 base plus exactly 28 bonus entries for random scale selection', () => {
    const bag = buildWeightedScaleBag('random')
    const counts = new Map<string, number>()
    for (const item of bag) {
      const key = `${item.root}:${item.scaleType}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(bag).toHaveLength(100)
    expect(counts.size).toBe(72)
    expect([...counts.values()].filter(count => count === 2)).toHaveLength(28)
    expect(Object.values(GENERAL_GUITAR_BASS_WEIGHTS).flat()).toHaveLength(28)
  })

  it('builds 18 major entries and exposes weights', () => {
    expect(buildWeightedScaleBag('major')).toHaveLength(18)
    expect(getScaleWeight(0, 'major')).toBe(2)
    expect(getScaleWeight(1, 'major')).toBe(1)
  })

  it('shuffles deterministically and avoids bag boundary duplicate', () => {
    const bag = buildWeightedScaleBag('major')
    const a = shuffleScaleBag(bag, createSeededRng(2))
    const b = shuffleScaleBag(bag, createSeededRng(2))
    expect(a).toEqual(b)
    const previous = a[0] as typeof a[number]
    const fixed = preventBoundaryDuplicate(previous, a)
    expect(fixed[0]).not.toEqual(previous)
  })

  it('leaves a single duplicate unchanged', () => {
    const combination = { root: 0 as const, scaleType: 'major' as const }
    expect(preventBoundaryDuplicate(combination, [combination])).toEqual([combination])
  })
})

const notes = Array.from({ length: 8 }, (_, index) => ({
  stringIndex: 0,
  fret: index,
  midi: 40 + index,
  pitchClass: (40 + index) % 12,
  scaleDegree: index % 7 + 1,
} as FretboardNote))

const position = (id: string): FretboardPosition => ({
  id,
  startFret: 0,
  notes,
  ascendingPath: notes,
  descendingPath: [...notes].reverse(),
})

describe('position bags', () => {
  it('uses a stable key, draws once, and refills away from previous', () => {
    expect(createPositionBagKey({ root: 0, scaleType: 'major', tuning: [40, 45] })).toBe('0:major:40,45')
    const positions = [position('a'), position('b'), position('c')]
    const bag = createPositionBag(positions, createSeededRng(2))
    const first = drawPosition(bag)
    expect(first.position).not.toBeNull()
    expect(first.bag.remaining).toHaveLength(2)
    const refill = refillPositionBag(positions, createSeededRng(2), first.position?.id)
    expect(refill.remaining[0]?.id).not.toBe(first.position?.id)
  })

  it('draws null from empty bag', () => {
    expect(drawPosition({ remaining: [], all: [], previousPositionId: null }).position).toBeNull()
  })
})

describe('exercise patterns', () => {
  it('keeps normal path unchanged', () => {
    expect(createNormalPattern(notes).map(item => item.note.midi)).toEqual(notes.map(note => note.midi))
  })

  it('creates exact 3- and 4-note windows', () => {
    expect(createSlidingWindowPattern(notes, 3).map(item => item.sourceIndex)).toEqual([
      0, 1, 2,
      1, 2, 3,
      2, 3, 4,
      3, 4, 5,
      4, 5, 6,
      5, 6, 7,
    ])
    expect(createSlidingWindowPattern(notes, 4).map(item => item.sourceIndex).slice(0, 8)).toEqual([
      0, 1, 2, 3,
      1, 2, 3, 4,
    ])
  })

  it('reverses before descending window processing', () => {
    expect(createAscendingExercise(notes, 'normal')[0]?.note.midi).toBe(40)
    expect(createDescendingExercise(notes, 'threeNote').slice(0, 3).map(item => item.note.midi)).toEqual([47, 46, 45])
  })

  it('omits the apex from Normal and 4-note descending turns, but keeps it for 3-note', () => {
    const params = {
      notes,
      scaleType: 'major' as const,
      tuning: [40],
      root: 0 as const,
    }

    const normal = planPracticePath({ ...params, exerciseType: 'normal' })
    expect(normal.ascending.at(-1)?.note.midi).toBe(47)
    expect(normal.descending[0]?.note.midi).toBe(46)

    const four = planPracticePath({ ...params, exerciseType: 'fourNote' })
    expect(four.ascending.at(-1)?.note.midi).toBe(47)
    expect(four.descending[0]?.note.midi).toBe(46)
    expect(four.descending.some(item => item.note.midi === 47)).toBe(false)

    const three = planPracticePath({ ...params, exerciseType: 'threeNote' })
    expect(three.descending[0]?.note.midi).toBe(47)
  })

  it('returns no partial window', () => {
    expect(createSlidingWindowPattern(notes.slice(0, 2), 3)).toEqual([])
  })
})
