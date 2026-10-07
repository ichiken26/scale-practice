import type { FretboardPosition,PositionBag,PositionBagKeyParams,PositionDrawResult } from '../types'
import type { SeededRng } from '../random/rng'
import { shuffleSeeded } from '../random/rng'
export function createPositionBagKey(params:PositionBagKeyParams):string{return `${params.root}:${params.scaleType}:${params.tuning.join(',')}`}
export function createPositionBag(positions:readonly FretboardPosition[],rng:SeededRng):PositionBag{return{remaining:shuffleSeeded(positions,rng),all:[...positions],previousPositionId:null}}
export function drawPosition(bag:PositionBag):PositionDrawResult{const [position,...remaining]=bag.remaining;return{position:position??null,bag:{...bag,remaining,previousPositionId:position?.id??bag.previousPositionId}}}
export function refillPositionBag(positions:readonly FretboardPosition[],rng:SeededRng,previousPositionId?:string):PositionBag{const shuffled=shuffleSeeded(positions,rng);if(previousPositionId&&shuffled[0]?.id===previousPositionId){const i=shuffled.findIndex(p=>p.id!==previousPositionId);if(i>0)[shuffled[0],shuffled[i]]=[shuffled[i] as FretboardPosition,shuffled[0] as FretboardPosition]}return{remaining:shuffled,all:[...positions],previousPositionId:previousPositionId??null}}
