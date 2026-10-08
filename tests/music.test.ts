import { describe, expect, it } from 'vitest'
import { frequencyFromMidi, midiToOctave, midiToPitchClass, mod12, nearestMidiForPitchClass, pitchClassDistanceUp } from '../src/domain/music/pitch'
import { generateAscendingScaleMidi, getNextScaleMidi, getScaleDegree, getScaleDegreeLabel, getScaleIntervals, getScalePitchClasses, isPitchClassInScale } from '../src/domain/music/scales'
import { chooseTonicSpelling, spellScale } from '../src/domain/music/spelling'
import { getTuningPresets, inferCustomTuningMidi, validateTuning } from '../src/domain/music/tuning'

describe('pitch and MIDI', () => {
  it('normalizes and converts boundary pitches', () => {
    expect(mod12(-1)).toBe(11)
    expect(midiToPitchClass(60)).toBe(0)
    expect(midiToOctave(60)).toBe(4)
    expect(midiToOctave(-1)).toBe(-2)
    expect(pitchClassDistanceUp(11, 0)).toBe(1)
  })
  it('uses deterministic lower note on nearest tie', () => {
    expect(nearestMidiForPitchClass(66, 0)).toBe(60)
    expect(nearestMidiForPitchClass(64, 0)).toBe(60)
  })
  it('calculates concert and low E frequencies', () => {
    expect(frequencyFromMidi(69)).toBe(440)
    expect(frequencyFromMidi(40)).toBeCloseTo(82.4069)
    expect(frequencyFromMidi(28)).toBeCloseTo(41.2034)
  })
  it('rejects invalid numbers', () => {
    expect(() => mod12(Infinity)).toThrow()
    expect(() => frequencyFromMidi(69, 0)).toThrow()
    expect(() => midiToOctave(1.5)).toThrow()
  })
})

describe('scale theory', () => {
  it('contains all requested interval sets', () => {
    expect(getScaleIntervals('major')).toEqual([0, 2, 4, 5, 7, 9, 11])
    expect(getScalePitchClasses(9, 'naturalMinor')).toEqual([9, 11, 0, 2, 4, 5, 7])
    expect(getScalePitchClasses(4, 'harmonicMinor')).toEqual([4, 6, 7, 9, 11, 0, 3])
    expect(getScalePitchClasses(0, 'melodicMinor')).toEqual([0, 2, 3, 5, 7, 9, 11])
    expect(getScalePitchClasses(4, 'minorPentatonic')).toEqual([4, 7, 9, 11, 2])
    expect(getScalePitchClasses(0, 'majorPentatonic')).toEqual([0, 2, 4, 7, 9])
  })

  it('formats interval degrees with major/minor quality and plain perfect degrees', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(degree => getScaleDegreeLabel('major', degree))).toEqual([
      '1', 'M2', 'M3', '4', '5', 'M6', 'M7',
    ])
    expect([1, 2, 3, 4, 5, 6, 7].map(degree => getScaleDegreeLabel('naturalMinor', degree))).toEqual([
      '1', 'M2', 'm3', '4', '5', 'm6', 'm7',
    ])
    expect([1, 2, 3, 4, 5].map(degree => getScaleDegreeLabel('minorPentatonic', degree))).toEqual([
      '1', 'm3', '4', '5', 'm7',
    ])
  })

  it('finds degree and next notes without duplicates', () => {
    expect(isPitchClassInScale(11, 0, 'major')).toBe(true)
    expect(getScaleDegree(11, 0, 'major')).toBe(7)
    expect(getScaleDegree(1, 0, 'major')).toBeNull()
    expect(getNextScaleMidi(60, 0, 'major')).toBe(62)
    expect(generateAscendingScaleMidi(60, 9, 0, 'major')).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74])
  })

  it('rejects invalid starting notes, counts, and degree labels', () => {
    expect(() => generateAscendingScaleMidi(61, 2, 0, 'major')).toThrow()
    expect(() => generateAscendingScaleMidi(60, -1, 0, 'major')).toThrow()
    expect(() => getScaleDegreeLabel('major', 8)).toThrow()
  })
})

describe('enharmonic spelling', () => {
  it.each([
    [0, 'major', 'C D E F G A B'],
    [3, 'major', 'Eb F G Ab Bb C D'],
    [8, 'major', 'Ab Bb C Db Eb F G'],
    [4, 'major', 'E F# G# A B C# D#'],
    [0, 'minorPentatonic', 'C Eb F G Bb'],
  ] as const)('spells %s %s', (root, type, text) => {
    expect(spellScale(root, type).notes.map(note => note.text).join(' ')).toBe(text)
  })
  it('chooses common flat tonic', () => expect(chooseTonicSpelling(3, 'major').text).toBe('Eb'))
  it('preserves one letter per degree', () => expect(new Set(spellScale(1, 'major').notes.map(note => note.letter)).size).toBe(7))
})

describe('tuning', () => {
  it('returns all presets', () => {
    expect(getTuningPresets('guitar', 6).map(item => item.midi)).toContainEqual([38, 45, 50, 55, 59, 64])
    expect(getTuningPresets('bass', 5)[0]?.midi).toEqual([23, 28, 33, 38, 43])
    expect(getTuningPresets('bass', 6)[0]?.midi).toEqual([23, 28, 33, 38, 43, 48])
  })
  it('infers ascending custom DADGBE', () => {
    expect(inferCustomTuningMidi([2, 9, 2, 7, 11, 4], [40, 45, 50, 55, 59, 64])).toEqual([38, 45, 50, 55, 59, 64])
  })
  it('validates boundaries and rejects re-entrant tuning', () => {
    expect(validateTuning([40, 45, 50]).valid).toBe(true)
    expect(validateTuning([40, 39, 50]).valid).toBe(false)
    expect(validateTuning([]).valid).toBe(false)
    expect(validateTuning([128]).valid).toBe(false)
  })
  it('rejects mismatched custom input', () => expect(() => inferCustomTuningMidi([0], [40, 45])).toThrow())
})
