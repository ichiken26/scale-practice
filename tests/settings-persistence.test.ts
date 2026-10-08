import { describe, expect, it } from 'vitest'
import { defaultSettings, loadSettings, sanitizeSettings, saveSettings } from '../src/settings/persistence'

function memory() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
  }
}

describe('settings persistence', () => {
  it('defaults to guitar, automatic root selection, and Major', () => {
    const settings = defaultSettings()
    expect(settings.guitar).toEqual({ stringCount: 6, tuningId: 'guitar-6-standard' })
    expect(settings.bass).toEqual({ stringCount: 4, tuningId: 'bass-4-standard' })
    expect(settings.instrument).toBe('guitar')
    expect(settings.root).toBe('auto')
    expect(settings.scaleType).toBe('major')
    expect(settings.fretboardLabelMode).toBe('note')
  })

  it('round-trips every setting, including fretboard interval labels', () => {
    const storage = memory()
    const settings = defaultSettings()
    settings.instrument = 'bass'
    settings.bass = { stringCount: 5, tuningId: 'bass-5-standard' }
    settings.guitar = { stringCount: 7, tuningId: 'guitar-7-drop-a' }
    settings.root = 4
    settings.scaleType = 'harmonicMinor'
    settings.exerciseType = 'fourNote'
    settings.mode = 'fullNeck'
    settings.fretboardLabelMode = 'degree'
    settings.bpm = 40
    settings.metronomeVolume = 0
    settings.referenceVolume = 1
    saveSettings(storage, settings)
    expect(loadSettings(storage)).toEqual(settings)
  })

  it('keeps the last valid string count at both ends of each instrument', () => {
    const saved = sanitizeSettings({
      instrument: 'guitar',
      guitar: { stringCount: 7, tuningId: 'guitar-7-standard' },
      bass: { stringCount: 6, tuningId: 'bass-6-standard' },
      root: 11,
      fretboardLabelMode: 'degree',
      bpm: 220,
    })
    expect(saved.guitar.stringCount).toBe(7)
    expect(saved.bass.stringCount).toBe(6)
    expect(saved.root).toBe(11)
    expect(saved.fretboardLabelMode).toBe('degree')
    expect(saved.bpm).toBe(220)
  })

  it('falls back to defaults for corrupt, missing, and out-of-range values', () => {
    expect(loadSettings({ getItem: () => null }).instrument).toBe('guitar')
    expect(loadSettings({ getItem: () => '{' }).bass.stringCount).toBe(4)
    const saved = sanitizeSettings({
      instrument: 'ukulele',
      guitar: { stringCount: 5, tuningId: '' },
      bass: null,
      root: 12,
      scaleType: 'chromatic',
      exerciseType: 'sixNote',
      mode: 'loop',
      fretboardLabelMode: 'solfege',
      bpm: 10,
      metronomeVolume: 2,
      referenceVolume: Number.NaN,
    })
    expect(saved.instrument).toBe('guitar')
    expect(saved.guitar).toEqual({ stringCount: 6, tuningId: 'guitar-6-standard' })
    expect(saved.bass.stringCount).toBe(4)
    expect(saved.root).toBe('auto')
    expect(saved.scaleType).toBe('major')
    expect(saved.exerciseType).toBe('normal')
    expect(saved.mode).toBe('randomPosition')
    expect(saved.fretboardLabelMode).toBe('note')
    expect(saved.bpm).toBe(100)
    expect(saved.metronomeVolume).toBe(0.3)
    expect(saved.referenceVolume).toBe(0.35)
  })
})
