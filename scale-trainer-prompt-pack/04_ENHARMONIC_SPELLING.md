# Task 04: Enharmonic Scale Spelling

対象: `src/domain/music/spelling.ts`

PitchClassだけから単純にsharp nameを返す実装は禁止。Scale Degreeごとのletter nameを維持する。

実装:
```ts
export interface SpelledPitch {
  letter: "A" | "B" | "C" | "D" | "E" | "F" | "G"
  accidental: number
  text: string
}
export interface SpelledScale {
  tonic: string
  notes: readonly SpelledPitch[]
}
export function spellScale(root: PitchClass, scaleType: ScaleType): SpelledScale
export function chooseTonicSpelling(root: PitchClass, scaleType: ScaleType): SpelledPitch
```

候補Tonic spellingを列挙し、accidental総数・double accidental強ペナルティ・非一般的spellingペナルティで最小scoreを選ぶ。

例:
- C Major = C D E F G A B
- Eb Major = Eb F G Ab Bb C D
- Ab Major = Ab Bb C Db Eb F G
- E Major = E F# G# A B C# D#
- D#/Eb MajorはEb Majorを選択

letter sequenceを壊してはいけない。Unit Testを十分に書く。
