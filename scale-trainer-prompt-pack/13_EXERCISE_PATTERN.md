# Task 13: Exercise Pattern Generation

対象: `src/domain/practice/pattern.ts`

実装:
```ts
export function createNormalPattern(path: readonly FretboardNote[]): readonly ExerciseNote[]
export function createSlidingWindowPattern(path: readonly FretboardNote[], windowSize: 3 | 4): readonly ExerciseNote[]
export function createAscendingExercise(basePath: readonly FretboardNote[], type: ExerciseType): readonly ExerciseNote[]
export function createDescendingExercise(basePath: readonly FretboardNote[], type: ExerciseType): readonly ExerciseNote[]
```

Normalはpathそのまま。
3-note: 123, 234, 345... 端数windowなし。
4-note: 1234, 2345, 3456...。
Descendingはbase pathをreverseしてから同じwindow処理。

8 notes入力時のexact sequenceをテスト。
