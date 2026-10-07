import type { PitchClass } from '../types'

export function mod12(value: number): PitchClass {
  if (!Number.isFinite(value)) throw new RangeError('value must be finite')
  return ((Math.trunc(value) % 12) + 12) % 12 as PitchClass
}
export function midiToPitchClass(midi: number): PitchClass { return mod12(midi) }
export function midiToOctave(midi: number): number {
  if (!Number.isInteger(midi)) throw new RangeError('midi must be an integer')
  return Math.floor(midi / 12) - 1
}
export function pitchClassDistanceUp(from: PitchClass, to: PitchClass): number { return mod12(to - from) }
export function nearestMidiForPitchClass(referenceMidi: number, target: PitchClass): number {
  if (!Number.isInteger(referenceMidi)) throw new RangeError('referenceMidi must be an integer')
  const down = referenceMidi - mod12(referenceMidi - target)
  const up = down + 12
  return referenceMidi - down <= up - referenceMidi ? down : up
}
export function frequencyFromMidi(midi: number, a4 = 440): number {
  if (!Number.isFinite(midi) || !Number.isFinite(a4) || a4 <= 0) throw new RangeError('midi and a4 must be finite; a4 must be positive')
  return a4 * 2 ** ((midi - 69) / 12)
}
