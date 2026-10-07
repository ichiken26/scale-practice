import type { PitchClass, ScaleType } from '../types'
import { getScaleIntervals } from './scales'
import { mod12 } from './pitch'

export interface SpelledPitch { letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G'; accidental: number; text: string }
export interface SpelledScale { tonic: string; notes: readonly SpelledPitch[] }
const LETTERS = ['C','D','E','F','G','A','B'] as const
const NATURAL: Record<(typeof LETTERS)[number], PitchClass> = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }
const accidentalText = (n:number) => n < 0 ? 'b'.repeat(-n) : '#'.repeat(n)
function accidentalFor(letter: keyof typeof NATURAL, pitch: PitchClass): number {
  let d: number = mod12(pitch - NATURAL[letter]); if (d > 6) d -= 12; return d
}
function make(letter: keyof typeof NATURAL, accidental:number): SpelledPitch { return { letter, accidental, text: `${letter}${accidentalText(accidental)}` } }
export function chooseTonicSpelling(root: PitchClass, scaleType: ScaleType): SpelledPitch {
  let best: {pitch:SpelledPitch;score:number}|null = null
  for (const letter of LETTERS) {
    const accidental = accidentalFor(letter, root); if (Math.abs(accidental)>2) continue
    const candidate = make(letter, accidental); const notes = spellFrom(candidate, scaleType)
    const score = notes.reduce((s,n)=>s+Math.abs(n.accidental)+(Math.abs(n.accidental)>1?20:0),0) + Math.abs(accidental)*0.1
    if (!best || score < best.score) best={pitch:candidate,score}
  }
  if (!best) throw new RangeError('unable to spell tonic')
  return best.pitch
}
function spellFrom(tonic: SpelledPitch, scaleType: ScaleType): SpelledPitch[] {
  const tonicIndex=LETTERS.indexOf(tonic.letter); const intervals=getScaleIntervals(scaleType)
  const letterSteps=scaleType==='majorPentatonic'?[0,1,2,4,5]:scaleType==='minorPentatonic'?[0,2,3,4,6]:[0,1,2,3,4,5,6]
  return intervals.map((interval,index)=>{ const letter=LETTERS[(tonicIndex+(letterSteps[index] as number))%7] as keyof typeof NATURAL; return make(letter, accidentalFor(letter,mod12(NATURAL[tonic.letter]+tonic.accidental+interval))) })
}
export function spellScale(root: PitchClass, scaleType: ScaleType): SpelledScale { const tonic=chooseTonicSpelling(root,scaleType); return {tonic:tonic.text,notes:spellFrom(tonic,scaleType)} }
