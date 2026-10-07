# Task 17: Reference Instrument DSP

対象: `src/audio/dsp/karplusStrong.ts`

AudioWorkletとは別にPure DSPとしてテスト可能にする。

実装候補:
```ts
export function createKarplusStrongVoice(params: KarplusStrongVoiceParams): KarplusStrongVoice
interface KarplusStrongVoice {
  processSample(): number
  isFinished(): boolean
}
export function getSynthParameters(instrument: InstrumentType): KarplusStrongParameters
```

PitchはMIDI → Hzで算出。
Guitar/Bassで damping / decay / excitation / filtering を変更。
NaN / Infinityを生成しない。非常に低いBass pitchでも安定。
DSP unit testsを書く。
