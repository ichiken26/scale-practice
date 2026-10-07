import type { FretboardCell,FretboardNote,PitchClass,ScaleType } from '../types'
import { midiToPitchClass } from '../music/pitch'
import { getScaleDegree } from '../music/scales'
export function midiAtFret(openStringMidi:number,fret:number):number{if(!Number.isInteger(openStringMidi)||!Number.isInteger(fret)||fret<0)throw new RangeError('MIDI and non-negative fret must be integers');return openStringMidi+fret}
export function fretForMidi(openStringMidi:number,midi:number):number{if(!Number.isInteger(openStringMidi)||!Number.isInteger(midi))throw new RangeError('MIDI values must be integers');return midi-openStringMidi}
export function buildFretboard(tuning:readonly number[],maxFret=24):readonly FretboardCell[]{if(!Number.isInteger(maxFret)||maxFret<0)throw new RangeError('maxFret must be non-negative');return tuning.flatMap((open,stringIndex)=>Array.from({length:maxFret+1},(_,fret)=>{const midi=open+fret;return{stringIndex,fret,midi,pitchClass:midiToPitchClass(midi)}}))}
export function findScaleLocations(tuning:readonly number[],root:PitchClass,scaleType:ScaleType,maxFret=24):readonly FretboardNote[]{return buildFretboard(tuning,maxFret).flatMap(cell=>{const degree=getScaleDegree(cell.pitchClass,root,scaleType);return degree===null?[]:[{...cell,scaleDegree:degree}]})}
