# Task 09: Continuous Path Search

対象: `src/domain/fretboard/continuous/` の `candidate.ts`, `search.ts`, `score.ts`, `constants.ts`。

実装:
```ts
export function generateContinuousCandidates(params: ContinuousSearchParams): readonly ContinuousPath[]
export function scorePlayability(path: ContinuousPath): number
export function scoreBalanced(path: ContinuousPath): number
export function scoreHorizontal(path: ContinuousPath): number
export function selectDistinctContinuousPaths(candidates: readonly ContinuousPath[], excludedPaths: readonly FretboardPath[]): readonly ContinuousPath[]
```

Hard constraints:
- Scale Degree skip禁止
- MIDI pitch常にascending
- 同MIDI重複禁止
- 同stringまたは隣のhigher stringのみ
- fret 0〜24
- 17F以上到達を目標

notes/string:
- Diatonic: 2〜5
- Pentatonic: 1〜4

Score metrics:
- totalFretMovement
- backwardFretMovement
- horizontalGain
- endingFret
- notesPerStringVariance
- positionShiftCount
- largeTransitionPenalty

3 modes: A Playability / B Balanced / C Horizontal。
magic numberは `CONTINUOUS_SCORE_WEIGHTS` へ分離。
同一input + seed → 同一result。
Linked Diagonalと完全一致するpathは除外。A/B/C同士も重複禁止。3本生成不能なら存在するdistinct pathだけ返す。

Unit Test:
- hard constraint違反なし
- A/B/C distinct
- CのhorizontalGainがA以上になる傾向
- deterministic
