import type { PitchClass, ScaleCombination, ScaleType } from '../types'
import type { SeededRng } from '../random/rng'
import { shuffleSeeded } from '../random/rng'
import { getScaleWeight } from './scaleWeights'

const TYPES: readonly ScaleType[] = [
  'major',
  'naturalMinor',
  'harmonicMinor',
  'melodicMinor',
  'majorPentatonic',
  'minorPentatonic',
]

export const CHROMATIC_ROOT_CYCLE: readonly PitchClass[] = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8]

export function buildWeightedScaleBag(selectedScale: ScaleType | 'random'): readonly ScaleCombination[] {
  const types = selectedScale === 'random' ? TYPES : [selectedScale]
  const out: ScaleCombination[] = []
  for (const scaleType of types) {
    for (let root = 0; root < 12; root += 1) {
      for (let copy = 0; copy < getScaleWeight(root as PitchClass, scaleType); copy += 1) {
        out.push({ root: root as PitchClass, scaleType })
      }
    }
  }
  return out
}

export function buildSequentialScaleCycle(scaleType: ScaleType): readonly ScaleCombination[] {
  return CHROMATIC_ROOT_CYCLE.map(root => ({ root, scaleType }))
}

export function shuffleScaleBag(bag: readonly ScaleCombination[], rng: SeededRng): ScaleCombination[] {
  return shuffleSeeded(bag, rng)
}

const same = (a: ScaleCombination, b: ScaleCombination) => a.root === b.root && a.scaleType === b.scaleType

export function preventBoundaryDuplicate(previous: ScaleCombination | null, nextBag: ScaleCombination[]): ScaleCombination[] {
  const out = [...nextBag]
  if (previous && out[0] && same(previous, out[0])) {
    const index = out.findIndex(item => !same(previous, item))
    if (index > 0) [out[0], out[index]] = [out[index] as ScaleCombination, out[0] as ScaleCombination]
  }
  return out
}
