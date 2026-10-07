import type { InstrumentType, PitchClass, TuningPreset, TuningValidationResult } from '../types'
import { nearestMidiForPitchClass } from './pitch'

const PRESETS: readonly TuningPreset[] = [
  {id:'guitar-6-standard',name:'Standard',instrument:'guitar',stringCount:6,midi:[40,45,50,55,59,64]},
  {id:'guitar-6-drop-d',name:'Drop D',instrument:'guitar',stringCount:6,midi:[38,45,50,55,59,64]},
  {id:'guitar-7-standard',name:'7-string Standard',instrument:'guitar',stringCount:7,midi:[35,40,45,50,55,59,64]},
  {id:'guitar-7-drop-a',name:'Drop A',instrument:'guitar',stringCount:7,midi:[33,40,45,50,55,59,64]},
  {id:'bass-4-standard',name:'Standard',instrument:'bass',stringCount:4,midi:[28,33,38,43]},
  {id:'bass-5-standard',name:'5-string Standard',instrument:'bass',stringCount:5,midi:[23,28,33,38,43]},
  {id:'bass-6-standard',name:'6-string Standard',instrument:'bass',stringCount:6,midi:[23,28,33,38,43,48]}
]
export function getTuningPresets(instrument: InstrumentType,stringCount:number):readonly TuningPreset[]{return PRESETS.filter(p=>p.instrument===instrument&&p.stringCount===stringCount)}
export function inferCustomTuningMidi(pitchClasses:readonly PitchClass[],referenceTuning:readonly number[]):readonly number[]{
  if(pitchClasses.length!==referenceTuning.length||!pitchClasses.length)throw new RangeError('pitch classes and reference tuning must have the same non-zero length')
  const out:number[]=[]
  for(let i=0;i<pitchClasses.length;i++){let midi=nearestMidiForPitchClass(referenceTuning[i] as number,pitchClasses[i] as PitchClass);while(i>0&&midi<=(out[i-1] as number))midi+=12;out.push(midi)}
  return out
}
export function validateTuning(tuning:readonly number[]):TuningValidationResult{const errors:string[]=[];if(!tuning.length)errors.push('Tuning must contain at least one string');if(tuning.some(m=>!Number.isInteger(m)||m<0||m>127))errors.push('MIDI notes must be integers from 0 to 127');for(let i=1;i<tuning.length;i++)if((tuning[i] as number)<=(tuning[i-1] as number))errors.push('Re-entrant or duplicate string pitches are not supported');return{valid:errors.length===0,errors}}
