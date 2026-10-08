export type PitchClass = 0|1|2|3|4|5|6|7|8|9|10|11
export type ScaleType = 'major'|'naturalMinor'|'harmonicMinor'|'melodicMinor'|'majorPentatonic'|'minorPentatonic'
export type InstrumentType = 'guitar'|'bass'
export type ExerciseType = 'normal'|'threeNote'|'fourNote'
export type PracticeMode = 'randomPosition'|'fullNeck'
export type RootSelection = PitchClass|'auto'
export type FretboardLabelMode = 'note'|'degree'

export interface FretboardCell { stringIndex: number; fret: number; midi: number; pitchClass: PitchClass }
export interface FretboardNote extends FretboardCell { scaleDegree: number }
export interface FretboardPath { id: string; notes: readonly FretboardNote[] }
export interface FretboardPosition {
  id: string; startFret: number; notes: readonly FretboardNote[]
  ascendingPath: readonly FretboardNote[]; descendingPath: readonly FretboardNote[]
}
export interface LinkedDiagonalPath extends FretboardPath { connectorInterval: 1|2|3; ascendingPath: readonly FretboardNote[]; descendingPath: readonly FretboardNote[] }
export type ContinuousMode = 'playability'|'balanced'|'horizontal'
export interface ContinuousMetrics { totalFretMovement: number; backwardFretMovement: number; horizontalGain: number; endingFret: number; notesPerStringVariance: number; positionShiftCount: number; largeTransitionPenalty: number }
export interface ContinuousPath extends FretboardPath { mode: ContinuousMode; metrics: ContinuousMetrics }
export interface TuningPreset { id: string; name: string; instrument: InstrumentType; stringCount: number; midi: readonly number[] }
export interface TuningValidationResult { valid: boolean; errors: readonly string[] }
export interface GeneratePositionParams { tuning: readonly number[]; root: PitchClass; scaleType: ScaleType; startMidi: number; maxFret?: number }
export interface EnumeratePositionParams { tuning: readonly number[]; root: PitchClass; scaleType: ScaleType; maxFret?: number }
export interface PositionValidationParams { tuning: readonly number[]; scaleType: ScaleType; maxFret?: number }
export interface PositionValidationResult { valid: boolean; errors: readonly string[] }
export interface LinkedDiagonalParams extends GeneratePositionParams { connectorInterval: 1|2|3 }
export type LinkedDiagonalBaseParams = Omit<LinkedDiagonalParams, 'startMidi'|'connectorInterval'>
export interface ContinuousSearchParams extends EnumeratePositionParams { seed: number }
export interface ScaleCombination { root: PitchClass; scaleType: ScaleType }
export interface PositionBagKeyParams extends ScaleCombination { tuning: readonly number[] }
export interface PositionBag { remaining: readonly FretboardPosition[]; all: readonly FretboardPosition[]; previousPositionId: string|null }
export interface PositionDrawResult { position: FretboardPosition|null; bag: PositionBag }
export interface ExerciseNote { note: FretboardNote; sourceIndex: number }
export interface TimelineEvent { tick: number; durationTicks: number; type: 'note'|'metronome'|'announcement'|'preview'|'rest'; midi?: number; note?: FretboardNote; accent?: boolean }
export interface ExerciseTimeline { events: readonly TimelineEvent[]; totalTicks: number; ascendingEndTick: number; descendingStartTick: number }
export interface BuildExerciseTimelineParams {
  ascending: readonly ExerciseNote[]
  descending: readonly ExerciseNote[]
  exerciseType: ExerciseType
  announcementBars?: number
  previewBars?: number
  gapBars?: number
}
export interface PracticeSettings { instrument: InstrumentType; tuning: readonly number[]; root: RootSelection; scaleType: ScaleType|'random'; exerciseType: ExerciseType; mode: PracticeMode; bpm: number; seed: number }
export interface PracticeRound { id: string; combination: ScaleCombination; paths: readonly FretboardPath[]; timeline: ExerciseTimeline; debugEvents: readonly string[] }
export interface RoundGenerationState { scaleBag: ScaleCombination[]; previousCombination: ScaleCombination|null; positionBags: Map<string,PositionBag> }
export interface RoundGenerationContext { settings: PracticeSettings; rng: import('../random/rng').SeededRng; previousCombination?: ScaleCombination|null; excludedPaths?: readonly FretboardPath[]; state?: RoundGenerationState }

export interface AudioClockSnapshot { contextTime: number; performanceTime: number; outputLatency: number }
export interface VisualTimelineState { currentEvent: TimelineEvent|null; nextEvent: TimelineEvent|null; eventIndex: number; progress: number }
export interface TimingSample { expectedTime: number; audioContextTime: number; outputContextTime: number; performanceTime: number; estimatedAudibleTime: number; visualTarget: number; visualActual: number; deviation: number; droppedFrames: number; audioContextState: string }
export interface TimingStatistics { count: number; max: number; mean: number; p95: number; p99: number }
