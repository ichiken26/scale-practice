<script setup lang="ts">
import type { ExerciseType, InstrumentType, PracticeMode, RootSelection, ScaleType } from '../domain/types'

defineProps<{
  instrument: InstrumentType
  stringCount: number
  tuningId: string
  root: RootSelection
  scaleType: ScaleType | 'random'
  exerciseType: ExerciseType
  mode: PracticeMode
  bpm: number
  metronomeVolume: number
  referenceVolume: number
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:instrument', v: InstrumentType): void
  (e: 'update:stringCount', v: number): void
  (e: 'update:tuningId', v: string): void
  (e: 'update:root', v: RootSelection): void
  (e: 'update:scaleType', v: ScaleType | 'random'): void
  (e: 'update:exerciseType', v: ExerciseType): void
  (e: 'update:mode', v: PracticeMode): void
  (e: 'update:bpm', v: number): void
  (e: 'update:metronomeVolume', v: number): void
  (e: 'update:referenceVolume', v: number): void
}>()

const roots = [
  ['0', 'C'],
  ['1', 'C#/Db'],
  ['2', 'D'],
  ['3', 'D#/Eb'],
  ['4', 'E'],
  ['5', 'F'],
  ['6', 'F#/Gb'],
  ['7', 'G'],
  ['8', 'G#/Ab'],
  ['9', 'A'],
  ['10', 'A#/Bb'],
  ['11', 'B'],
] as const

function rootValue(event: Event): RootSelection {
  const value = (event.target as HTMLSelectElement).value
  return value === 'auto' ? 'auto' : Number(value) as RootSelection
}
</script>

<template>
  <details class="panel settings">
    <summary>Settings</summary>
    <div class="settings-grid">
      <label>Instrument<select :disabled="disabled" :value="instrument" @change="emit('update:instrument', ($event.target as HTMLSelectElement).value as InstrumentType)"><option value="guitar">Guitar</option><option value="bass">Bass</option></select></label>
      <label>Strings<select :disabled="disabled" :value="stringCount" @change="emit('update:stringCount', Number(($event.target as HTMLSelectElement).value))"><option v-for="n in instrument === 'guitar' ? [6, 7] : [4, 5, 6]" :key="n">{{ n }}</option></select></label>
      <label>Tuning<select :disabled="disabled" :value="tuningId" @change="emit('update:tuningId', ($event.target as HTMLSelectElement).value)"><option v-for="t in instrument === 'guitar' ? (stringCount === 7 ? [['guitar-7-standard', 'Standard'], ['guitar-7-drop-a', 'Drop A']] : [['guitar-6-standard', 'Standard'], ['guitar-6-drop-d', 'Drop D']]) : [[`bass-${stringCount}-standard`, 'Standard']]" :key="t[0]" :value="t[0]">{{ t[1] }}</option></select></label>
      <label>Root<select :disabled="disabled" :value="root" @change="emit('update:root', rootValue($event))"><option value="auto">Auto (A→G#)</option><option v-for="[value, label] in roots" :key="value" :value="value">{{ label }}</option></select></label>
      <label>Scale<select :disabled="disabled" :value="scaleType" @change="emit('update:scaleType', ($event.target as HTMLSelectElement).value as ScaleType | 'random')"><option value="random">Random</option><option value="major">Major</option><option value="naturalMinor">Natural Minor</option><option value="harmonicMinor">Harmonic Minor</option><option value="melodicMinor">Melodic Minor</option><option value="majorPentatonic">Major Pentatonic</option><option value="minorPentatonic">Minor Pentatonic</option></select></label>
      <label>Pattern<select :disabled="disabled" :value="exerciseType" @change="emit('update:exerciseType', ($event.target as HTMLSelectElement).value as ExerciseType)"><option value="normal">Normal</option><option value="threeNote">3-note</option><option value="fourNote">4-note</option></select></label>
      <label>Mode<select :disabled="disabled" :value="mode" @change="emit('update:mode', ($event.target as HTMLSelectElement).value as PracticeMode)"><option value="randomPosition">Random Position</option><option value="fullNeck">Full Neck</option></select></label>
      <label>BPM<input type="number" min="40" max="220" :disabled="disabled" :value="bpm" @input="emit('update:bpm', Number(($event.target as HTMLInputElement).value))"></label>
      <label>Click<input :value="metronomeVolume" type="range" min="0" max="1" step=".01" @input="emit('update:metronomeVolume', Number(($event.target as HTMLInputElement).value))"></label>
      <label>Reference<input :value="referenceVolume" type="range" min="0" max="1" step=".01" @input="emit('update:referenceVolume', Number(($event.target as HTMLInputElement).value))"></label>
    </div>
  </details>
</template>
