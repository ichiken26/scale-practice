# Task 22: Timing Debug System

30分Timing Testに使用するdebug recorderを実装。

実装:
```ts
export function createTimingRecorder(...)
export function recordTimingSample(...)
export function calculateTimingStats(samples): TimingStatistics
```

Stats:
- max
- mean
- p95
- p99

記録:
- expected time
- AudioContext currentTime
- output timestamp contextTime
- performanceTime
- estimated audible time
- visual target
- visual actual
- deviation
- dropped frames
- AudioContext state

Debug UIにSession Seedも表示。
CSV/JSON exportは任意。
Acceptance target: P99 <= 25ms。
