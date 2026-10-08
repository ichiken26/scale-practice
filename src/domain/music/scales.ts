import type { PitchClass, ScaleType } from '../types'
import { midiToPitchClass, mod12 } from './pitch'

export const SCALE_INTERVALS: Readonly<Record<ScaleType, readonly number[]>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
}

export const SCALE_DEGREE_LABELS: Readonly<Record<ScaleType, readonly string[]>> = {
  major: ['1', 'M2', 'M3', '4', '5', 'M6', 'M7'],
  naturalMinor: ['1', 'M2', 'm3', '4', '5', 'm6', 'm7'],
  harmonicMinor: ['1', 'M2', 'm3', '4', '5', 'm6', 'M7'],
  melodicMinor: ['1', 'M2', 'm3', '4', '5', 'M6', 'M7'],
  majorPentatonic: ['1', 'M2', 'M3', '5', 'M6'],
  minorPentatonic: ['1', 'm3', '4', '5', 'm7'],
}

export function getScaleIntervals(scaleType: ScaleType): readonly number[] {
  return SCALE_INTERVALS[scaleType]
}

export function getScalePitchClasses(root: PitchClass, scaleType: ScaleType): readonly PitchClass[] {
  return getScaleIntervals(scaleType).map(interval => mod12(root + interval))
}

export function isPitchClassInScale(pitchClass: PitchClass, root: PitchClass, scaleType: ScaleType): boolean {
  return getScalePitchClasses(root, scaleType).includes(pitchClass)
}

export function getScaleDegree(pitchClass: PitchClass, root: PitchClass, scaleType: ScaleType): number | null {
  const index = getScalePitchClasses(root, scaleType).indexOf(pitchClass)
  return index < 0 ? null : index + 1
}

export function getScaleDegreeLabel(scaleType: ScaleType, scaleDegree: number): string {
  if (!Number.isInteger(scaleDegree) || scaleDegree < 1) throw new RangeError('scaleDegree must be a positive integer')
  const label = SCALE_DEGREE_LABELS[scaleType][scaleDegree - 1]
  if (!label) throw new RangeError('scaleDegree is outside the selected scale')
  return label
}

export function getNextScaleMidi(currentMidi: number, root: PitchClass, scaleType: ScaleType): number {
  if (!Number.isInteger(currentMidi)) throw new RangeError('currentMidi must be an integer')
  for (let midi = currentMidi + 1; midi <= currentMidi + 12; midi += 1) {
    if (isPitchClassInScale(midiToPitchClass(midi), root, scaleType)) return midi
  }
  throw new RangeError('scale has no next tone')
}

export function generateAscendingScaleMidi(
  startMidi: number,
  count: number,
  root: PitchClass,
  scaleType: ScaleType,
): readonly number[] {
  if (!Number.isInteger(startMidi) || !Number.isInteger(count) || count < 0) {
    throw new RangeError('startMidi and non-negative count must be integers')
  }
  if (!isPitchClassInScale(midiToPitchClass(startMidi), root, scaleType)) {
    throw new RangeError('startMidi must be a scale tone')
  }
  const result: number[] = []
  let midi = startMidi
  for (let index = 0; index < count; index += 1) {
    result.push(midi)
    midi = getNextScaleMidi(midi, root, scaleType)
  }
  return result
}
