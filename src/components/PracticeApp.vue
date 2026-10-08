<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import type { ExerciseType, FretboardLabelMode, InstrumentType, PracticeMode, PracticeRound, RootSelection, ScaleType, VisualTimelineState } from '../domain/types'
import { getTuningPresets } from '../domain/music/tuning'
import { randomSeed } from '../domain/random/rng'
import { loadSettings, saveSettings, type InstrumentPreference, type PersistedSettings } from '../settings/persistence'
import { tickToContextTime } from '../domain/timeline/timeline'
import { ExerciseWorkerClient } from '../workers/exerciseClient'
import { PracticeAudioEngine } from '../audio/practiceAudio'
import { estimateAudibleContextTime, getClockSnapshot, getVisualStateAtTick, timelineTickAtContextTime } from '../audio/audioClock'
import { createTimingRecorder } from '../debug/timingRecorder'
import SettingsPanel from './SettingsPanel.vue'
import ScaleHeader from './ScaleHeader.vue'
import FretboardView from './FretboardView.vue'
import TransportControls from './TransportControls.vue'
import DebugPanel from './DebugPanel.vue'
import KeyboardView from './KeyboardView.vue'

const stored = loadSettings(typeof localStorage === 'undefined' ? { getItem: () => null } : localStorage)
const preferences = ref<Pick<PersistedSettings, 'guitar' | 'bass'>>({ guitar: stored.guitar, bass: stored.bass })
const instrument = ref<InstrumentType>(stored.instrument)
const stringCount = ref(stored[stored.instrument].stringCount)
const tuningId = ref(resolveTuning(stored.instrument, stored[stored.instrument].stringCount, stored[stored.instrument].tuningId))
const rootSelection = ref<RootSelection>(stored.root)
const scaleType = ref<ScaleType | 'random'>(stored.scaleType)
const exerciseType = ref<ExerciseType>(stored.exerciseType)
const mode = ref<PracticeMode>(stored.mode)
const fretboardLabelMode = ref<FretboardLabelMode>(stored.fretboardLabelMode)
const bpm = ref(stored.bpm)
const seed = ref(randomSeed())
const playing = ref(false)
const loading = ref(false)
const round = ref<PracticeRound | null>(null)
const visual = ref<VisualTimelineState>({ currentEvent: null, nextEvent: null, eventIndex: -1, progress: 0 })
const pathIndex = ref(0)
const metronomeVolume = ref(stored.metronomeVolume)
const referenceVolume = ref(stored.referenceVolume)
const error = ref('')
const tuning = computed(() => getTuningPresets(instrument.value, stringCount.value).find(item => item.id === tuningId.value)?.midi ?? getTuningPresets(instrument.value, stringCount.value)[0]?.midi ?? [])
const selectedScale = computed(() => round.value?.combination.scaleType ?? null)
const selectedRoot = computed(() => round.value?.combination.root ?? null)
const currentPath = computed(() => round.value?.paths[pathIndex.value]?.notes ?? [])
const currentMidi = computed(() => visual.value.currentEvent?.note?.midi ?? visual.value.currentEvent?.midi ?? null)
const lowMidi = computed(() => currentPath.value.length ? Math.min(...currentPath.value.map(note => note.midi)) : null)
const highMidi = computed(() => currentPath.value.length ? Math.max(...currentPath.value.map(note => note.midi)) : null)
const audio = new PracticeAudioEngine()
const recorder = createTimingRecorder()
let worker: ExerciseWorkerClient | null = null
let frame = 0
let sessionStart = 0
let wakeLock: WakeLockSentinel | null = null
let lastFramePerformance = 0
let lastRecordedEvent = -1
let nextRound: PracticeRound | null = null
let nextSessionStart = 0
let arming = false
let sessionToken = 0
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true })

watch([rootSelection, scaleType, exerciseType, mode, fretboardLabelMode, bpm, metronomeVolume, referenceVolume], () => persist())
watch([metronomeVolume, referenceVolume], () => { audio.setVolumes(metronomeVolume.value, referenceVolume.value) })

function resolveTuning(nextInstrument: InstrumentType, count: number, id: string): string {
  const presets = getTuningPresets(nextInstrument, count)
  return presets.some(preset => preset.id === id) ? id : presets[0]?.id ?? id
}

function remember(nextInstrument: InstrumentType, count: number, id: string) {
  const preference: InstrumentPreference = { stringCount: count, tuningId: id }
  preferences.value = { ...preferences.value, [nextInstrument]: preference }
}

function persist() {
  if (typeof localStorage === 'undefined') return
  saveSettings(localStorage, {
    instrument: instrument.value,
    guitar: preferences.value.guitar,
    bass: preferences.value.bass,
    root: rootSelection.value,
    scaleType: scaleType.value,
    exerciseType: exerciseType.value,
    mode: mode.value,
    fretboardLabelMode: fretboardLabelMode.value,
    bpm: bpm.value,
    metronomeVolume: metronomeVolume.value,
    referenceVolume: referenceVolume.value,
  })
}

function selectInstrument(next: InstrumentType) {
  if (next === instrument.value) return
  remember(instrument.value, stringCount.value, tuningId.value)
  const preference = preferences.value[next]
  instrument.value = next
  stringCount.value = preference.stringCount
  tuningId.value = resolveTuning(next, preference.stringCount, preference.tuningId)
  remember(next, stringCount.value, tuningId.value)
  persist()
}

function selectStringCount(count: number) {
  stringCount.value = count
  tuningId.value = resolveTuning(instrument.value, count, tuningId.value)
  remember(instrument.value, count, tuningId.value)
  persist()
}

function selectTuning(id: string) {
  tuningId.value = resolveTuning(instrument.value, stringCount.value, id)
  remember(instrument.value, stringCount.value, tuningId.value)
  persist()
}

function settings() {
  return {
    instrument: instrument.value,
    tuning: tuning.value,
    root: rootSelection.value,
    scaleType: scaleType.value,
    exerciseType: exerciseType.value,
    mode: mode.value,
    bpm: bpm.value,
    seed: seed.value,
  }
}

async function armNext() {
  const current = round.value
  const token = sessionToken
  if (arming || nextRound || !worker || !current || !playing.value) return
  const planned = sessionStart + tickToContextTime(current.timeline.totalTicks, bpm.value, 0)
  arming = true
  try {
    const combination = toRaw(current.combination)
    const drawn = await worker.generateNext({ root: combination.root, scaleType: combination.scaleType })
    if (!playing.value || token !== sessionToken || round.value !== current) return
    nextSessionStart = audio.enqueue(drawn.timeline, bpm.value, instrument.value, planned, {
      metronome: metronomeVolume.value,
      reference: referenceVolume.value,
    })
    nextRound = drawn
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to draw the next scale'
    stop()
  } finally {
    arming = false
  }
}

async function start() {
  sessionToken += 1
  loading.value = true
  error.value = ''
  try {
    worker?.dispose()
    worker = new ExerciseWorkerClient()
    await worker.init(settings())
    round.value = await worker.generateNext()
    pathIndex.value = 0
    nextRound = null
    nextSessionStart = 0
    recorder.clear()
    lastRecordedEvent = -1
    lastFramePerformance = performance.now()
    const timing = await audio.start(round.value.timeline, bpm.value, instrument.value, {
      metronome: metronomeVolume.value,
      reference: referenceVolume.value,
    })
    sessionStart = timing.sessionStart
    playing.value = true
    try {
      wakeLock = await navigator.wakeLock?.request('screen') ?? null
    } catch {
      wakeLock = null
    }
    animate()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to start'
  } finally {
    loading.value = false
  }
}

function stop() {
  sessionToken += 1
  playing.value = false
  nextRound = null
  nextSessionStart = 0
  cancelAnimationFrame(frame)
  audio.stop()
  void wakeLock?.release()
  wakeLock = null
  visual.value = { currentEvent: null, nextEvent: null, eventIndex: -1, progress: 0 }
}

function toggle() {
  if (playing.value) stop()
  else void start()
}

function animate() {
  const context = audio.audioContext
  const current = round.value
  if (!playing.value || !context || !current) return
  const now = performance.now()
  const snapshot = getClockSnapshot(context)
  const audible = estimateAudibleContextTime(snapshot, now)
  let tick = timelineTickAtContextTime(audible, sessionStart, bpm.value)
  if (tick >= current.timeline.totalTicks && nextRound) {
    round.value = nextRound
    sessionStart = nextSessionStart
    nextRound = null
    nextSessionStart = 0
    pathIndex.value = 0
    lastRecordedEvent = -1
    tick = timelineTickAtContextTime(audible, sessionStart, bpm.value)
  } else if (tick >= current.timeline.descendingStartTick) {
    void armNext()
  }
  const active = round.value
  if (!active) return
  visual.value = getVisualStateAtTick(active.timeline, tick)
  const currentEvent = visual.value.currentEvent
  if (currentEvent && visual.value.eventIndex !== lastRecordedEvent) {
    const expected = tickToContextTime(currentEvent.tick, bpm.value, sessionStart)
    const visualTarget = snapshot.performanceTime + (expected - snapshot.contextTime) * 1000
    recorder.record({
      expectedTime: expected,
      audioContextTime: context.currentTime,
      outputContextTime: snapshot.contextTime,
      performanceTime: now,
      estimatedAudibleTime: audible,
      visualTarget,
      visualActual: now,
      deviation: (now - visualTarget) / 1000,
      droppedFrames: Math.max(0, Math.round((now - lastFramePerformance) / (1000 / 60)) - 1),
      audioContextState: context.state,
    })
    lastRecordedEvent = visual.value.eventIndex
  }
  lastFramePerformance = now
  if (active.paths.length > 1) {
    pathIndex.value = Math.min(active.paths.length - 1, Math.floor(Math.max(0, tick) / active.timeline.totalTicks * active.paths.length))
  }
  frame = requestAnimationFrame(animate)
}

function keydown(event: KeyboardEvent) {
  const target = event.target
  if (event.code === 'Space' && target instanceof HTMLElement && !['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) {
    event.preventDefault()
    toggle()
  }
}

function visibility() {
  if (document.hidden && playing.value) stop()
}

onMounted(() => {
  remember(instrument.value, stringCount.value, tuningId.value)
  persist()
  window.addEventListener('keydown', keydown)
  document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => {
  stop()
  worker?.dispose()
  void audio.dispose()
  window.removeEventListener('keydown', keydown)
  document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <main>
    <div v-if="needRefresh && !playing" class="update">A new version is ready. <button @click="updateServiceWorker(true)">Update</button></div>
    <ScaleHeader :combination="round?.combination ?? null" />
    <SettingsPanel
      :instrument="instrument"
      :string-count="stringCount"
      :tuning-id="tuningId"
      :root="rootSelection"
      :scale-type="scaleType"
      :exercise-type="exerciseType"
      :mode="mode"
      :fretboard-label-mode="fretboardLabelMode"
      :bpm="bpm"
      :metronome-volume="metronomeVolume"
      :reference-volume="referenceVolume"
      :disabled="playing || loading"
      @update:instrument="selectInstrument"
      @update:string-count="selectStringCount"
      @update:tuning-id="selectTuning"
      @update:root="rootSelection = $event"
      @update:scale-type="scaleType = $event"
      @update:exercise-type="exerciseType = $event"
      @update:mode="mode = $event"
      @update:fretboard-label-mode="fretboardLabelMode = $event"
      @update:bpm="bpm = $event"
      @update:metronome-volume="metronomeVolume = $event"
      @update:reference-volume="referenceVolume = $event"
    />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="practice">
      <div class="progress">
        <span>{{ mode === 'fullNeck' && round ? `Position ${pathIndex + 1} / ${round.paths.length}` : playing ? 'Now play!!' : 'Ready' }}</span>
      </div>
      <FretboardView
        :tuning="tuning"
        :root="selectedRoot"
        :scale-type="selectedScale"
        :path="currentPath"
        :current="visual.currentEvent?.note ?? null"
        :label-mode="fretboardLabelMode"
      />
      <div class="controls">
        <TransportControls :playing="playing" :loading="loading" @toggle="toggle" />
      </div>
    </section>
    <KeyboardView :root="selectedRoot" :scale-type="selectedScale" :current-midi="currentMidi" :low-midi="lowMidi" :high-midi="highMidi" />
    <DebugPanel :seed="seed" :stats="recorder.stats()" :events="round?.debugEvents ?? []" />
  </main>
</template>
