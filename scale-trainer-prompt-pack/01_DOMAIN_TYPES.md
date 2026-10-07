# Task 01: Core Domain Types

統合仕様に従って、アプリ全体で使用するDomain Typesを実装してください。

候補: `src/domain/types/` 配下に `pitch.ts`, `scale.ts`, `instrument.ts`, `tuning.ts`, `fretboard.ts`, `practice.ts`, `timeline.ts`。

最低限定義:
```ts
type PitchClass = 0|1|2|3|4|5|6|7|8|9|10|11

type ScaleType =
  | "major"
  | "naturalMinor"
  | "harmonicMinor"
  | "melodicMinor"
  | "majorPentatonic"
  | "minorPentatonic"

type InstrumentType = "guitar" | "bass"

interface FretboardNote {
  stringIndex: number
  fret: number
  midi: number
  pitchClass: PitchClass
  scaleDegree: number
}

interface FretboardPosition {
  id: string
  startFret: number
  notes: readonly FretboardNote[]
  ascendingPath: readonly FretboardNote[]
  descendingPath: readonly FretboardNote[]
}
```

`LinkedDiagonalPath`, `ContinuousPath`, `TimelineEvent`, `PracticeSettings` も後続実装に必要なフィールドを補って定義する。

型へVue / DOM / AudioNode等を入れない。Runtime logicはまだ実装しない。
