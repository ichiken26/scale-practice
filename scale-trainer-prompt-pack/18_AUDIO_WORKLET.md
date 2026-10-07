# Task 18: AudioWorklet Scheduler

対象: `src/audio/worklets/practiceProcessor.ts`

AudioWorkletProcessorを実装。
責務:
- Metronome rendering
- Reference note rendering
- future event queue
- exact sample offset scheduling

重要: render quantum = 128 と仮定禁止。
`outputs[0][channel].length` を現在block sizeとして扱う。

event target frameはabsolute AudioContext frame。
`currentFrame` 〜 `currentFrame + blockLength` 内にeventがあれば `offset = eventFrame - currentFrame` sampleから発音。

message API:
- LOAD_EVENTS
- CLEAR_EVENTS
- SET_VOLUMES
- STOP

STOPはfuture events clear + active voicesを短いfadeで終了。
Metronomeはbeat1 accent、beat2-4 normal。
AudioWorklet MessagePort到着時刻を音楽Timelineとして使わない。
