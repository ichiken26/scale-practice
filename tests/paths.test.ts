import{describe,expect,it}from'vitest'
import{generateAllLinkedDiagonals,generateLinkedDiagonal}from'../src/domain/fretboard/linkedDiagonal'
import{generateContinuousCandidates}from'../src/domain/fretboard/continuous/candidate'
import{calculateContinuousMetrics,scoreBalanced,scoreHorizontal,scorePlayability}from'../src/domain/fretboard/continuous/score'
import{selectDistinctContinuousPaths}from'../src/domain/fretboard/continuous/search'
import type{ContinuousPath,FretboardNote}from'../src/domain/types'
const guitar=[40,45,50,55,59,64]
describe('linked diagonals',()=>{
  it('generates connector A/B/C paths that strictly ascend',()=>{const paths=generateAllLinkedDiagonals({tuning:guitar,root:0,scaleType:'major'});expect(paths.map(p=>p.connectorInterval)).toEqual([1,2,3]);for(const path of paths){expect(path.notes.at(-1)?.fret).toBeGreaterThanOrEqual(17);expect(new Set(path.notes.map(n=>n.midi)).size).toBe(path.notes.length);expect(path.notes.slice(1).every((n,i)=>n.midi>(path.notes[i] as FretboardNote).midi)).toBe(true);expect(path.descendingPath).toEqual([...path.ascendingPath].reverse())}})
  it('adds connectors on configured strings',()=>{const p=generateLinkedDiagonal({tuning:guitar,root:0,scaleType:'major',startMidi:43,connectorInterval:1});expect(p?.notes.filter(n=>n.stringIndex===0)).toHaveLength(4);expect(p?.notes.filter(n=>n.stringIndex===5)).toHaveLength(3)})
  it('returns null outside playable range',()=>expect(generateLinkedDiagonal({tuning:guitar,root:0,scaleType:'major',startMidi:84,connectorInterval:1})).toBeNull())
})
describe('continuous paths',()=>{
  it('generates deterministic candidates under hard constraints',()=>{const p={tuning:guitar,root:0 as const,scaleType:'major' as const,seed:42},a=generateContinuousCandidates(p),b=generateContinuousCandidates(p);expect(a).toEqual(b);expect(a.length).toBeGreaterThan(2);for(const path of a.slice(0,20))for(let i=1;i<path.notes.length;i++){const previous=path.notes[i-1] as FretboardNote,current=path.notes[i] as FretboardNote;expect(current.midi).toBeGreaterThan(previous.midi);expect(current.stringIndex===previous.stringIndex||current.stringIndex===previous.stringIndex+1).toBe(true)}})
  it('selects distinct A/B/C excluding an existing path',()=>{const candidates=generateContinuousCandidates({tuning:guitar,root:0,scaleType:'major',seed:9}),selected=selectDistinctContinuousPaths(candidates,candidates.slice(0,1));expect(selected.length).toBeGreaterThanOrEqual(2);expect(new Set(selected.map(p=>p.notes.map(n=>`${n.stringIndex}:${n.fret}`).join(','))).size).toBe(selected.length);expect(selected.find(p=>p.mode==='horizontal')?.metrics.horizontalGain??0).toBeGreaterThanOrEqual(selected.find(p=>p.mode==='playability')?.metrics.horizontalGain??0)})
  it('calculates and scores every metric',()=>{const notes=[{stringIndex:0,fret:3,midi:43,pitchClass:7,scaleDegree:5},{stringIndex:0,fret:5,midi:45,pitchClass:9,scaleDegree:6},{stringIndex:1,fret:3,midi:48,pitchClass:0,scaleDegree:1}] as FretboardNote[],metrics=calculateContinuousMetrics({notes}),path={id:'x',notes,mode:'balanced',metrics} as ContinuousPath;expect(metrics.totalFretMovement).toBe(4);expect([scorePlayability(path),scoreBalanced(path),scoreHorizontal(path)].every(Number.isFinite)).toBe(true)})
  it('returns no selection when candidates are empty',()=>expect(selectDistinctContinuousPaths([],[])).toEqual([]))
})
