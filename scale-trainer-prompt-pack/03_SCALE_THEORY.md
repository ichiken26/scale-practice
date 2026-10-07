# Task 03: Scale Theory

対象: `src/domain/music/scales.ts`

`SCALE_INTERVALS`:
- Major: 0 2 4 5 7 9 11
- Natural Minor: 0 2 3 5 7 8 10
- Harmonic Minor: 0 2 3 5 7 8 11
- Melodic Minor: 0 2 3 5 7 9 11
- Major Pentatonic: 0 2 4 7 9
- Minor Pentatonic: 0 3 5 7 10

実装:
```ts
export function getScaleIntervals(scaleType: ScaleType): readonly number[]
export function getScalePitchClasses(root: PitchClass, scaleType: ScaleType): readonly PitchClass[]
export function isPitchClassInScale(pitchClass: PitchClass, root: PitchClass, scaleType: ScaleType): boolean
export function getScaleDegree(pitchClass: PitchClass, root: PitchClass, scaleType: ScaleType): number | null
export function getNextScaleMidi(currentMidi: number, root: PitchClass, scaleType: ScaleType): number
export function generateAscendingScaleMidi(startMidi: number, count: number, root: PitchClass, scaleType: ScaleType): readonly number[]
```

getNextScaleMidiはcurrentMidiより必ず高い次のScale Tone。generateAscendingScaleMidiは同じMIDIを重複しない。

テスト: C Major / A Natural Minor / E Harmonic Minor / C Melodic Minor / E Minor Pentatonic / C Major Pentatonic。
