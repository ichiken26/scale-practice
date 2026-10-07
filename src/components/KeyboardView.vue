<script setup lang="ts">
import { computed } from 'vue'
import type { PitchClass, ScaleType } from '../domain/types'
import { midiToPitchClass } from '../domain/music/pitch'
import { spellScale } from '../domain/music/spelling'

const props = defineProps<{ root: PitchClass | null; scaleType: ScaleType | null; currentMidi: number | null; lowMidi: number | null; highMidi: number | null }>()
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const
const BLACK = new Set([1, 3, 6, 8, 10])

const startMidi = computed(() => {
  const low = props.lowMidi
  const high = props.highMidi
  const current = props.currentMidi
  const focus = low !== null && high !== null ? Math.round((low + high) / 2) : current ?? 60
  let start = Math.floor(focus / 12) * 12 - 12
  if (current !== null && Number.isInteger(current)) {
    if (current < start) start = Math.floor(current / 12) * 12
    else if (current > start + 24) start = Math.ceil((current - 24) / 12) * 12
  }
  return start
})
const endMidi = computed(() => startMidi.value + 24)

const spellings = computed(() => {
  if (props.root === null || !props.scaleType) return new Map<PitchClass, string>()
  const spelled = new Map<PitchClass, string>()
  for (const note of spellScale(props.root, props.scaleType).notes) {
    const pitch = ((NATURAL[note.letter] + note.accidental) % 12 + 12) % 12 as PitchClass
    spelled.set(pitch, note.text)
  }
  return spelled
})

const keys = computed(() => {
  const scale = spellings.value
  const start = startMidi.value
  const white: { midi: number; name: string; inScale: boolean; current: boolean }[] = []
  const black: { midi: number; name: string; inScale: boolean; current: boolean; left: number }[] = []
  let whiteIndex = 0
  for (let midi = start; midi <= endMidi.value; midi += 1) {
    const pitch = midiToPitchClass(midi)
    const key = {
      midi,
      name: scale.get(pitch) ?? SHARPS[pitch] ?? '',
      inScale: scale.has(pitch),
      current: props.currentMidi === midi,
    }
    if (BLACK.has(pitch)) black.push({ ...key, left: whiteIndex * 42 - 13 })
    else {
      white.push(key)
      whiteIndex += 1
    }
  }
  return { white, black, width: white.length * 42 }
})
</script>

<template>
  <section class="keyboard" aria-label="Piano keyboard">
    <div class="piano" :style="{ width: `${keys.width}px` }">
      <div v-for="key in keys.white" :key="key.midi" class="white-key">
        <span v-if="key.inScale" class="key-dot" :class="{ current: key.current }" />
        <span class="key-name">{{ key.name }}</span>
      </div>
      <div v-for="key in keys.black" :key="key.midi" class="black-key" :style="{ left: `${key.left}px` }">
        <span v-if="key.inScale" class="key-dot" :class="{ current: key.current }" />
        <span class="key-name">{{ key.name }}</span>
      </div>
    </div>
  </section>
</template>
