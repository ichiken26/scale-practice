import type { ExerciseType, FretboardLabelMode, InstrumentType, PracticeMode, RootSelection, ScaleType } from '../domain/types'

export interface InstrumentPreference {
  stringCount: number
  tuningId: string
}

export interface PersistedSettings {
  instrument: InstrumentType
  guitar: InstrumentPreference
  bass: InstrumentPreference
  root: RootSelection
  scaleType: ScaleType | 'random'
  exerciseType: ExerciseType
  mode: PracticeMode
  fretboardLabelMode: FretboardLabelMode
  bpm: number
  metronomeVolume: number
  referenceVolume: number
}

const STORAGE_KEY = 'scale-trainer-settings'
const SCALE_TYPES = ['random', 'major', 'naturalMinor', 'harmonicMinor', 'melodicMinor', 'majorPentatonic', 'minorPentatonic'] as const
const EXERCISE_TYPES = ['normal', 'threeNote', 'fourNote'] as const
const MODES = ['randomPosition', 'fullNeck'] as const
const FRETBOARD_LABEL_MODES = ['note', 'degree'] as const
const GUITAR_STRINGS = [6, 7] as const
const BASS_STRINGS = [4, 5, 6] as const

export function defaultSettings(): PersistedSettings {
  return {
    instrument: 'guitar',
    guitar: { stringCount: 6, tuningId: 'guitar-6-standard' },
    bass: { stringCount: 4, tuningId: 'bass-4-standard' },
    root: 'auto',
    scaleType: 'major',
    exerciseType: 'normal',
    mode: 'randomPosition',
    fretboardLabelMode: 'note',
    bpm: 100,
    metronomeVolume: 0.3,
    referenceVolume: 0.35,
  }
}

export function sanitizeSettings(value: unknown): PersistedSettings {
  const defaults = defaultSettings()
  if (!isRecord(value)) return defaults
  return {
    instrument: value.instrument === 'bass' ? 'bass' : 'guitar',
    guitar: sanitizeInstrument(value.guitar, 'guitar', defaults.guitar),
    bass: sanitizeInstrument(value.bass, 'bass', defaults.bass),
    root: sanitizeRoot(value.root, defaults.root),
    scaleType: oneOf(value.scaleType, SCALE_TYPES, defaults.scaleType),
    exerciseType: oneOf(value.exerciseType, EXERCISE_TYPES, defaults.exerciseType),
    mode: oneOf(value.mode, MODES, defaults.mode),
    fretboardLabelMode: oneOf(value.fretboardLabelMode, FRETBOARD_LABEL_MODES, defaults.fretboardLabelMode),
    bpm: finiteInRange(value.bpm, 40, 220, defaults.bpm),
    metronomeVolume: finiteInRange(value.metronomeVolume, 0, 1, defaults.metronomeVolume),
    referenceVolume: finiteInRange(value.referenceVolume, 0, 1, defaults.referenceVolume),
  }
}

export function loadSettings(storage: Pick<Storage, 'getItem'>): PersistedSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return defaultSettings()
    return sanitizeSettings(JSON.parse(raw) as unknown)
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(storage: Pick<Storage, 'setItem'>, settings: PersistedSettings): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)))
}

function sanitizeRoot(value: unknown, fallback: RootSelection): RootSelection {
  if (value === 'auto') return value
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 11
    ? value as RootSelection
    : fallback
}

function sanitizeInstrument(value: unknown, instrument: InstrumentType, fallback: InstrumentPreference): InstrumentPreference {
  if (!isRecord(value)) return fallback
  const allowed = instrument === 'guitar' ? GUITAR_STRINGS : BASS_STRINGS
  const stringCount = allowed.find(count => count === value.stringCount) ?? fallback.stringCount
  const tuningId = typeof value.tuningId === 'string' && value.tuningId.length > 0 ? value.tuningId : fallback.tuningId
  return { stringCount, tuningId }
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find(item => item === value) ?? fallback
}

function finiteInRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
