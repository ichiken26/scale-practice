import type { ContinuousMode,ContinuousMetrics } from '../../types'
export const CONTINUOUS_SCORE_WEIGHTS:Readonly<Record<ContinuousMode,Readonly<Record<keyof ContinuousMetrics,number>>>>={
  playability:{totalFretMovement:-1,backwardFretMovement:-4,horizontalGain:0.4,endingFret:0.2,notesPerStringVariance:-3,positionShiftCount:-2,largeTransitionPenalty:-5},
  balanced:{totalFretMovement:-0.5,backwardFretMovement:-2,horizontalGain:1.2,endingFret:0.6,notesPerStringVariance:-1.5,positionShiftCount:-1,largeTransitionPenalty:-3},
  horizontal:{totalFretMovement:-0.01,backwardFretMovement:-0.1,horizontalGain:100,endingFret:0.1,notesPerStringVariance:-0.1,positionShiftCount:0.1,largeTransitionPenalty:-0.2}
}
export const MAX_CONTINUOUS_CANDIDATES=5000
