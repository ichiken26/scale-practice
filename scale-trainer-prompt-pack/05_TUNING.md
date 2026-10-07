# Task 05: Instrument Tuning

対象: `src/domain/music/tuning.ts`

Preset MIDI:
- Guitar 6 Standard: 40 45 50 55 59 64
- Guitar 6 Drop D: 38 45 50 55 59 64
- Guitar 7 Standard: 35 40 45 50 55 59 64
- Guitar 7 Drop A: 33 40 45 50 55 59 64
- Bass 4: 28 33 38 43
- Bass 5: 23 28 33 38 43
- Bass 6: 23 28 33 38 43 48

実装:
```ts
export function getTuningPresets(instrument: InstrumentType, stringCount: number): readonly TuningPreset[]
export function inferCustomTuningMidi(pitchClasses: readonly PitchClass[], referenceTuning: readonly number[]): readonly number[]
export function validateTuning(tuning: readonly number[]): TuningValidationResult
```

lowest string → highest string順。MVPではre-entrant tuningをreject。Custom tuningはreference standard pitchに近いoctaveを使いつつ原則ascending MIDI pitchに推定。

テスト: Drop D / 5弦Bass / 6弦Bass / D A D G B E / invalid re-entrant。
