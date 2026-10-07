import type { ScaleCombination,ScaleType } from '../types'
import type { SeededRng } from '../random/rng'
import { shuffleSeeded } from '../random/rng'
import { getScaleWeight } from './scaleWeights'
const TYPES:readonly ScaleType[]=['major','naturalMinor','harmonicMinor','melodicMinor','majorPentatonic','minorPentatonic']
export function buildWeightedScaleBag(selectedScale:ScaleType|'random'):readonly ScaleCombination[]{const types=selectedScale==='random'?TYPES:[selectedScale],out:ScaleCombination[]=[];for(const scaleType of types)for(let root=0;root<12;root++)for(let i=0;i<getScaleWeight(root as ScaleCombination['root'],scaleType);i++)out.push({root:root as ScaleCombination['root'],scaleType});return out}
export function shuffleScaleBag(bag:readonly ScaleCombination[],rng:SeededRng):ScaleCombination[]{return shuffleSeeded(bag,rng)}
const same=(a:ScaleCombination,b:ScaleCombination)=>a.root===b.root&&a.scaleType===b.scaleType
export function preventBoundaryDuplicate(previous:ScaleCombination|null,nextBag:ScaleCombination[]):ScaleCombination[]{const out=[...nextBag];if(previous&&out[0]&&same(previous,out[0])){const index=out.findIndex(x=>!same(previous,x));if(index>0)[out[0],out[index]]=[out[index] as ScaleCombination,out[0] as ScaleCombination]}return out}
