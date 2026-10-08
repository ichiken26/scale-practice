<script setup lang="ts">
import type { ScaleCombination } from '../domain/types'
import { spellScale } from '../domain/music/spelling'

withDefaults(defineProps<{ combination: ScaleCombination | null; showNotes?: boolean }>(), {
  showNotes: true,
})
const names = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
</script>

<template>
  <header class="scale-header">
    <template v-if="combination">
      <h1>{{ names[combination.root] }} {{ combination.scaleType.replace(/([A-Z])/g, ' $1') }}</h1>
      <div v-if="showNotes" class="scale-notes">
        <span v-for="(note, index) in spellScale(combination.root, combination.scaleType).notes" :key="note.text" :class="{ tonic: index === 0 }">{{ note.text }}</span>
      </div>
    </template>
    <template v-else>
      <h1>Scale Trainer</h1>
      <p>Choose your settings and start practicing.</p>
    </template>
  </header>
</template>
