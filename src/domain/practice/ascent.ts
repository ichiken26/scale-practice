import type { ExerciseNote, ExerciseType, FretboardNote, PitchClass, ScaleType } from '../types'
import { getNotesPerString } from '../fretboard/positionGenerator'
import { createAscendingExercise, createDescendingExercise } from './pattern'

export interface PlannedPracticePath {
  displayNotes: readonly FretboardNote[]
  ascending: readonly ExerciseNote[]
  descending: readonly ExerciseNote[]
}

export interface PlanPracticePathParams {
  notes: readonly FretboardNote[]
  scaleType: ScaleType
  tuning: readonly number[]
  root: PitchClass
  exerciseType: ExerciseType
}

/** One strict 2NPS/3NPS position: every string, no extra notes past the box. */
export function practiceAscentNoteCount(scaleType: ScaleType, stringCount: number): number {
  if (!Number.isInteger(stringCount) || stringCount < 1) throw new RangeError('stringCount must be a positive integer')
  return stringCount * getNotesPerString(scaleType)
}

export function limitToPracticeAscent(notes: readonly FretboardNote[], scaleType: ScaleType, stringCount: number): readonly FretboardNote[] {
  if (!Number.isInteger(stringCount) || stringCount < 1) throw new RangeError('stringCount must be a positive integer')
  if (!notes.length) return []
  if (notes.length === practiceAscentNoteCount(scaleType, stringCount) && !coversEveryString(notes, stringCount)) {
    throw new RangeError('A boxed position must use every string')
  }
  return notes
}

function coversEveryString(notes: readonly FretboardNote[], stringCount: number): boolean {
  const seen = new Set(notes.map(note => note.stringIndex))
  for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) if (!seen.has(stringIndex)) return false
  return true
}

/**
 * Play the position straight up, then straight back down.
 * The shape already uses every string, so nothing is added after the top note.
 */
export function planPracticePath(params: PlanPracticePathParams): PlannedPracticePath {
  if (!params.tuning.length) throw new RangeError('tuning is required')
  const core = limitToPracticeAscent(params.notes, params.scaleType, params.tuning.length)
  return {
    displayNotes: core,
    ascending: createAscendingExercise(core, params.exerciseType),
    descending: createDescendingExercise(core, params.exerciseType),
  }
}
