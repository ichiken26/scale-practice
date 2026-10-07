# Task 06: Fretboard Model

対象: `src/domain/fretboard/fretboard.ts`

実装:
```ts
export function midiAtFret(openStringMidi: number, fret: number): number
export function fretForMidi(openStringMidi: number, midi: number): number
export function buildFretboard(tuning: readonly number[], maxFret?: number): readonly FretboardCell[]
export function findScaleLocations(tuning: readonly number[], root: PitchClass, scaleType: ScaleType, maxFret?: number): readonly FretboardNote[]
```

maxFret default = 24。fret 0を含む。
stringIndex規則は全Repositoryで統一。推奨: 0 = lowest string。UIで上下反転する責任はView層。

Unit Test:
- Guitar Standard E2 12F = E3
- Bass E1 12F = E2
- 24Fまで生成
