import type { FretboardNote,LinkedDiagonalBaseParams,LinkedDiagonalParams,LinkedDiagonalPath } from '../types'
import { generateAscendingScaleMidi,getScaleDegree,isPitchClassInScale } from '../music/scales'
import { midiToPitchClass } from '../music/pitch'
import { getNotesPerString } from './positionGenerator'
export type ConnectorInterval=1|2|3
export function generateLinkedDiagonal(params:LinkedDiagonalParams):LinkedDiagonalPath|null{
  const {tuning,root,scaleType,startMidi,connectorInterval}=params,max=params.maxFret??24,nps=getNotesPerString(scaleType)
  if(!tuning.length||!isPitchClassInScale(midiToPitchClass(startMidi),root,scaleType))return null
  const counts=tuning.map((_,i)=>nps+(i<tuning.length-1&&i%connectorInterval===connectorInterval-1?1:0)),midis=generateAscendingScaleMidi(startMidi,counts.reduce((a,b)=>a+b,0),root,scaleType),notes:FretboardNote[]=[];let cursor=0
  for(let s=0;s<tuning.length;s++)for(let j=0;j<(counts[s] as number);j++){const midi=midis[cursor++] as number,fret=midi-(tuning[s] as number);if(fret<0||fret>max)return null;const pitchClass=midiToPitchClass(midi);notes.push({stringIndex:s,fret,midi,pitchClass,scaleDegree:getScaleDegree(pitchClass,root,scaleType) as number})}
  return{id:`linked-${root}-${scaleType}-${connectorInterval}-${startMidi}`,connectorInterval,notes,ascendingPath:notes,descendingPath:[...notes].reverse()}
}
export function generateAllLinkedDiagonals(params:LinkedDiagonalBaseParams):readonly LinkedDiagonalPath[]{const low=params.tuning[0];if(low===undefined)return[];const max=params.maxFret??24,result:LinkedDiagonalPath[]=[];for(const interval of [1,2,3] as const){let best:LinkedDiagonalPath|null=null;for(let midi=low;midi<=low+max;midi++){const candidate=generateLinkedDiagonal({...params,startMidi:midi,connectorInterval:interval});if(candidate&&(candidate.notes.at(-1)?.fret??0)>=17){best=candidate;break}}if(best)result.push(best)}return result}
