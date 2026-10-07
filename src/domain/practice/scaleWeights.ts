import type { PitchClass,ScaleType } from '../types'
const BONUS:Readonly<Record<ScaleType,readonly PitchClass[]>>={major:[0,7,2,9,4,5],naturalMinor:[9,4,11,6,1,2],harmonicMinor:[9,4,2,11],melodicMinor:[],majorPentatonic:[0,7,2,9,4,5],minorPentatonic:[4,9,2,7,11,0]}
export const GENERAL_GUITAR_BASS_WEIGHTS=BONUS
export function getScaleWeight(root:PitchClass,scaleType:ScaleType):1|2{return BONUS[scaleType].includes(root)?2:1}
