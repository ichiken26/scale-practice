import type { EnumeratePositionParams,FretboardNote,FretboardPosition,GeneratePositionParams,PositionValidationParams,PositionValidationResult,ScaleType } from '../types'
import { midiToPitchClass } from '../music/pitch'
import { generateAscendingScaleMidi,getScaleDegree,isPitchClassInScale } from '../music/scales'

export function getNotesPerString(scaleType:ScaleType):2|3{return scaleType.endsWith('Pentatonic')?2:3}
export function generatePositionFromStartMidi(params:GeneratePositionParams):FretboardPosition|null{
  const {tuning,root,scaleType,startMidi}=params,maxFret=params.maxFret??24,nps=getNotesPerString(scaleType)
  if(!tuning.length||!isPitchClassInScale(midiToPitchClass(startMidi),root,scaleType))return null
  const midis=generateAscendingScaleMidi(startMidi,tuning.length*nps,root,scaleType),notes:FretboardNote[]=[]
  for(let stringIndex=0;stringIndex<tuning.length;stringIndex++)for(let j=0;j<nps;j++){const midi=midis[stringIndex*nps+j] as number,fret=midi-(tuning[stringIndex] as number),pitchClass=midiToPitchClass(midi),scaleDegree=getScaleDegree(pitchClass,root,scaleType) as number;notes.push({stringIndex,fret,midi,pitchClass,scaleDegree})}
  const position:FretboardPosition={id:`${root}-${scaleType}-${startMidi}`,startFret:notes[0]?.fret??0,notes,ascendingPath:notes,descendingPath:[...notes].reverse()}
  return validatePosition(position,{tuning,scaleType,maxFret}).valid?position:null
}
export function enumeratePositions(params:EnumeratePositionParams):readonly FretboardPosition[]{const max=params.maxFret??24,low=params.tuning[0];if(low===undefined)return[];const out:FretboardPosition[]=[];for(let midi=low;midi<=low+max;midi++){const pos=generatePositionFromStartMidi({...params,startMidi:midi});if(pos)out.push(pos)}return out.sort((a,b)=>a.startFret-b.startFret)}
export function validatePosition(position:FretboardPosition,params:PositionValidationParams):PositionValidationResult{
  const errors:string[]=[],max=params.maxFret??24,nps=getNotesPerString(params.scaleType),degreeCount=nps===3?7:5
  if(position.notes.length!==params.tuning.length*nps)errors.push('Position must use every string with the required notes per string')
  for(const note of position.notes){
    if(note.fret<0||note.fret>max)errors.push('Fret is outside the allowed range')
    const open=params.tuning[note.stringIndex]
    if(open===undefined||open+note.fret!==note.midi)errors.push('Note does not match its string and fret')
  }
  for(let stringIndex=0;stringIndex<params.tuning.length;stringIndex++){
    const onString=position.notes.filter(note=>note.stringIndex===stringIndex),frets=onString.map(note=>note.fret)
    if(onString.length!==nps)errors.push('Every string must contain the required notes per string')
    if(nps===3&&frets.length&&Math.max(...frets)-Math.min(...frets)>4)errors.push('Diatonic per-string span exceeds four frets')
  }
  for(let index=1;index<position.ascendingPath.length;index++){
    const current=position.ascendingPath[index] as FretboardNote,previous=position.ascendingPath[index-1] as FretboardNote
    if(current.midi<=previous.midi)errors.push('Ascending path must strictly ascend')
    if(current.scaleDegree!==previous.scaleDegree%degreeCount+1)errors.push('Ascending path must not skip scale degrees')
  }
  return{valid:errors.length===0,errors:[...new Set(errors)]}
}
