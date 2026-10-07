# Task 14: Tick Timeline

対象: `src/domain/timeline/constants.ts`, `timeline.ts`, `padding.ts`

constants:
- PPQN = 960
- QUARTER = 960
- EIGHTH = 480
- QUARTER_TRIPLET = 640
- BAR_4_4 = 3840

実装:
```ts
export function ticksPerExerciseNote(exercise: ExerciseType): number
export function alignTickToNextBar(tick: number): number
export function buildExerciseTimeline(params: BuildExerciseTimelineParams): ExerciseTimeline
export function tickToContextTime(tick: number, bpm: number, sessionStartContextTime: number): number
export function timelineDurationSeconds(totalTicks: number, bpm: number): number
```

重要: 時刻を `previousEventTime + duration` で生成禁止。必ずabsolute tickから計算。

Ascending終了が小節途中なら最後noteをbar endまでHold。Descendingは次bar頭。頂点noteはdescending最初で再attack。
Reference通常slot 80%、Padding holdは100% bar endまで。

Unit Test: BPM40 / 100 / 220、3-note triplet、bar boundary、float driftなし。
