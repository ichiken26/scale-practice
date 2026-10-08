<script setup lang="ts">
import { computed } from 'vue'
import type { FretboardLabelMode, FretboardNote, PitchClass, ScaleType } from '../domain/types'
import { findScaleLocations } from '../domain/fretboard/fretboard'
import { getScaleDegreeLabel } from '../domain/music/scales'
import { spellScale } from '../domain/music/spelling'

const props = defineProps<{
  tuning: readonly number[]
  root: PitchClass | null
  scaleType: ScaleType | null
  path: readonly FretboardNote[]
  current: FretboardNote | null
  labelMode: FretboardLabelMode
}>()

const locations = computed(() => props.root === null || props.scaleType === null ? [] : findScaleLocations(props.tuning, props.root, props.scaleType))
const spellings = computed(() => {
  if (props.root === null || props.scaleType === null) return new Map<number, string>()
  return new Map(spellScale(props.root, props.scaleType).notes.map((note, index) => [index + 1, note.text]))
})
const label = (note: FretboardNote) => {
  if (props.labelMode === 'degree' && props.scaleType !== null) return getScaleDegreeLabel(props.scaleType, note.scaleDegree)
  return spellings.value.get(note.scaleDegree) ?? ''
}
const key = (note: FretboardNote) => `${note.stringIndex}:${note.fret}`
const pathKeys = computed(() => new Set(props.path.map(key)))
const pathRoots = computed(() => locations.value.filter(note => note.scaleDegree === 1 && pathKeys.value.has(key(note))))
const ROW = 32
const x = (fret: number) => 40 + fret * 36
const y = (stringIndex: number) => 18 + (props.tuning.length - 1 - stringIndex) * ROW
const toneClass = (note: FretboardNote) => {
  const id = key(note)
  const classes = ['tone']
  if (pathKeys.value.has(id)) classes.push('path')
  if (props.current && key(props.current) === id) classes.push('current')
  return classes
}
const radius = (note: FretboardNote) => props.current && key(props.current) === key(note) ? 13 : pathKeys.value.has(key(note)) ? 12 : 11
</script>

<template>
  <div>
    <div class="fretboard-scroll">
      <svg class="fretboard" :viewBox="`0 0 ${40 + 24 * 36 + 30} ${y(0) + 26}`" role="img" aria-label="Fretboard from fret 0 to 24">
        <g class="grid">
          <line v-for="s in tuning.length" :key="`s${s}`" x1="40" :x2="40 + 24 * 36" :y1="y(s - 1)" :y2="y(s - 1)" />
          <line v-for="f in 25" :key="`f${f}`" :x1="x(f - 1)" :x2="x(f - 1)" y1="18" :y2="y(0) + 14" />
          <text v-for="f in 25" :key="`t${f}`" :x="x(f - 1)" :y="y(0) + 20">{{ f - 1 }}</text>
        </g>
        <g>
          <g v-for="note in locations" :key="key(note)">
            <circle :cx="x(note.fret)" :cy="y(note.stringIndex)" :r="radius(note)" :class="toneClass(note)" />
            <text :x="x(note.fret)" :y="y(note.stringIndex)" :class="toneClass(note)">{{ label(note) }}</text>
          </g>
        </g>
        <g>
          <circle v-for="note in pathRoots" :key="`root-${key(note)}`" class="root-ring" :cx="x(note.fret)" :cy="y(note.stringIndex)" :r="radius(note) + 3.25" />
          <circle v-for="note in pathRoots" :key="`root-inner-${key(note)}`" class="root-ring inner" :cx="x(note.fret)" :cy="y(note.stringIndex)" :r="radius(note) + 1.6" />
        </g>
      </svg>
    </div>
    <ul class="legend" aria-label="Fretboard legend">
      <li><i class="swatch scale" />スケール音</li>
      <li><i class="swatch path" />今回弾く音</li>
      <li><i class="swatch root" />ルート</li>
      <li><i class="swatch current" />今弾く音</li>
    </ul>
  </div>
</template>
