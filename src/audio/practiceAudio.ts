import type { ExerciseTimeline, InstrumentType } from '../domain/types'
import { tickToContextTime } from '../domain/timeline/timeline'
import practiceProcessorUrl from './worklets/practiceProcessor.ts?worker&url'

type ScheduledEvent = {
  frame: number
  durationFrames: number
  type: 'metronome' | 'note'
  midi?: number
  accent?: boolean
  instrument?: InstrumentType
}
type PracticeNodeMessage =
  | { type: 'LOAD_EVENTS'; events: ScheduledEvent[] }
  | { type: 'CLEAR_EVENTS' }
  | { type: 'SET_VOLUMES'; metronome: number; reference: number }
  | { type: 'STOP' }

const ENQUEUE_LEAD_SECONDS = 0.05
const INTERACTIVE_LATENCY_TARGET_SECONDS = 0.01

export function resolveEnqueueStart(requested: number, currentTime: number): number {
  if (!Number.isFinite(requested) || !Number.isFinite(currentTime)) throw new RangeError('enqueue times must be finite')
  return Math.max(requested, currentTime + ENQUEUE_LEAD_SECONDS)
}

function scheduleEvents(
  timeline: ExerciseTimeline,
  bpm: number,
  instrument: InstrumentType,
  sessionStart: number,
  sampleRate: number,
): ScheduledEvent[] {
  return timeline.events
    .filter(event => event.type === 'note' || event.type === 'metronome')
    .map(event => ({
      ...(event.midi === undefined ? {} : { midi: event.midi }),
      ...(event.accent === undefined ? {} : { accent: event.accent }),
      frame: Math.round(tickToContextTime(event.tick, bpm, sessionStart) * sampleRate),
      durationFrames: Math.max(1, Math.round(event.durationTicks / 960 * 60 / bpm * sampleRate)),
      type: event.type as 'note' | 'metronome',
      instrument,
    }))
}

export class PracticeAudioEngine {
  private context: AudioContext | null = null
  private node: AudioWorkletNode | null = null

  private async ensureRunning(): Promise<AudioContext> {
    const context = this.context ?? new AudioContext({ latencyHint: INTERACTIVE_LATENCY_TARGET_SECONDS })
    this.context = context
    if (context.state !== 'running') await context.resume()
    if (!this.node) {
      await context.audioWorklet.addModule(practiceProcessorUrl)
      this.node = new AudioWorkletNode(context, 'practice-processor', { outputChannelCount: [2] })
      this.node.connect(context.destination)
    }
    return context
  }

  private load(
    timeline: ExerciseTimeline,
    bpm: number,
    instrument: InstrumentType,
    sessionStart: number,
    volumes: { metronome: number; reference: number },
  ): void {
    if (!this.context || !this.node) throw new Error('Audio is not running')
    this.node.port.postMessage({ type: 'SET_VOLUMES', ...volumes } satisfies PracticeNodeMessage)
    const events = scheduleEvents(timeline, bpm, instrument, sessionStart, this.context.sampleRate)
    this.node.port.postMessage({ type: 'LOAD_EVENTS', events } satisfies PracticeNodeMessage)
  }

  async start(
    timeline: ExerciseTimeline,
    bpm: number,
    instrument: InstrumentType,
    volumes = { metronome: 0.3, reference: 0.35 },
  ): Promise<{ context: AudioContext; sessionStart: number }> {
    const context = await this.ensureRunning()
    const sessionStart = context.currentTime + 0.12
    this.load(timeline, bpm, instrument, sessionStart, volumes)
    return { context, sessionStart }
  }

  /** Append the next scale at an absolute context time without clearing the current one. */
  enqueue(
    timeline: ExerciseTimeline,
    bpm: number,
    instrument: InstrumentType,
    sessionStart: number,
    volumes = { metronome: 0.3, reference: 0.35 },
  ): number {
    if (!this.context) throw new Error('Audio is not running')
    const start = resolveEnqueueStart(sessionStart, this.context.currentTime)
    this.load(timeline, bpm, instrument, start, volumes)
    return start
  }

  setVolumes(metronome: number, reference: number): void {
    this.node?.port.postMessage({ type: 'SET_VOLUMES', metronome, reference } satisfies PracticeNodeMessage)
  }

  stop(): void {
    this.node?.port.postMessage({ type: 'STOP' } satisfies PracticeNodeMessage)
  }

  get audioContext(): AudioContext | null {
    return this.context
  }

  async dispose(): Promise<void> {
    this.stop()
    this.node?.disconnect()
    this.node = null
    if (this.context) await this.context.close()
    this.context = null
  }
}
