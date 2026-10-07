# Task 02: Pitch / MIDI Utilities

対象: `src/domain/music/pitch.ts`

実装:
```ts
export function mod12(value: number): PitchClass
export function midiToPitchClass(midi: number): PitchClass
export function midiToOctave(midi: number): number
export function pitchClassDistanceUp(from: PitchClass, to: PitchClass): number
export function nearestMidiForPitchClass(referenceMidi: number, target: PitchClass): number
export function frequencyFromMidi(midi: number, a4?: number): number
```

要件:
- A4 = MIDI 69 = 440Hz
- mod12は負数でも0〜11へ正規化
- nearestMidiForPitchClassはreferenceMidiから絶対距離最小。tie規則も決定論的に定義

テスト必須:
- mod12(-1) = 11
- midiToPitchClass(60) = C
- midiToOctave(60) = 4
- frequencyFromMidi(69) = 440
- E2 MIDI 40
- E1 MIDI 28
- 境界・負値
