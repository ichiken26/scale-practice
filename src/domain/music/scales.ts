import type { PitchClass, ScaleType } from '../types'
import { midiToPitchClass, mod12 } from './pitch'

export const SCALE_INTERVALS: Readonly<Record<ScaleType, readonly number[]>> = {
  major: [0,2,4,5,7,9,11], naturalMinor: [0,2,3,5,7,8,10], harmonicMinor: [0,2,3,5,7,8,11],
  melodicMinor: [0,2,3,5,7,9,11], majorPentatonic: [0,2,4,7,9], minorPentatonic: [0,3,5,7,10]
}
export function getScaleIntervals(scaleType: ScaleType): readonly number[] { return SCALE_INTERVALS[scaleType] }
export function getScalePitchClasses(root: PitchClass, scaleType: ScaleType): readonly PitchClass[] { return getScaleIntervals(scaleType).map(i => mod12(root + i)) }
export function isPitchClassInScale(pitchClass: PitchClass, root: PitchClass, scaleType: ScaleType): boolean { return getScalePitchClasses(root, scaleType).includes(pitchClass) }
export function getScaleDegree(pitchClass: PitchClass, root: PitchClass, scaleType: ScaleType): number|null {
  const index = getScalePitchClasses(root, scaleType).indexOf(pitchClass); return index < 0 ? null : index + 1
}
export function getNextScaleMidi(currentMidi: number, root: PitchClass, scaleType: ScaleType): number {
  if (!Number.isInteger(currentMidi)) throw new RangeError('currentMidi must be an integer')
  for (let midi = currentMidi + 1; midi <= currentMidi + 12; midi++) if (isPitchClassInScale(midiToPitchClass(midi), root, scaleType)) return midi
  throw new RangeError('scale has no next tone')
}
export function generateAscendingScaleMidi(startMidi: number, count: number, root: PitchClass, scaleType: ScaleType): readonly number[] {
  if (!Number.isInteger(startMidi) || !Number.isInteger(count) || count < 0) throw new RangeError('startMidi and non-negative count must be integers')
  if (!isPitchClassInScale(midiToPitchClass(startMidi), root, scaleType)) throw new RangeError('startMidi must be a scale tone')
  const result: number[] = []; let midi = startMidi
  for (let i=0;i<count;i++) { result.push(midi); midi = getNextScaleMidi(midi, root, scaleType) }
  return result
}
