# Task 19: Audio / Visual Clock Mapping

対象: `src/audio/audioClock.ts`

実装:
```ts
export function getClockSnapshot(audioContext: AudioContext): AudioClockSnapshot
export function estimateAudibleContextTime(snapshot: AudioClockSnapshot, performanceNow: number): number
export function timelineTickAtContextTime(contextTime: number, sessionStart: number, bpm: number): number
export function getVisualStateAtTick(timeline: ExerciseTimeline, tick: number): VisualTimelineState
```

優先: `AudioContext.getOutputTimestamp()`。
fallback: `AudioContext.currentTime`。
`outputLatency` はfeature detection。
Visual Offset(ms)を適用可能。
requestAnimationFrameは現在時刻の問い合わせにのみ利用し、callback回数でnote indexを進めない。
frame drop後は現在tickからVisualStateを完全再計算。
