import type { ExerciseNote,ExerciseType,FretboardNote } from '../types'
export function createNormalPattern(path:readonly FretboardNote[]):readonly ExerciseNote[]{return path.map((note,sourceIndex)=>({note,sourceIndex}))}
export function createSlidingWindowPattern(path:readonly FretboardNote[],windowSize:3|4):readonly ExerciseNote[]{const out:ExerciseNote[]=[];for(let start=0;start+windowSize<=path.length;start++)for(let offset=0;offset<windowSize;offset++)out.push({note:path[start+offset] as FretboardNote,sourceIndex:start+offset});return out}
const create=(path:readonly FretboardNote[],type:ExerciseType)=>type==='normal'?createNormalPattern(path):createSlidingWindowPattern(path,type==='threeNote'?3:4)
export function createAscendingExercise(basePath:readonly FretboardNote[],type:ExerciseType):readonly ExerciseNote[]{return create(basePath,type)}
export function createDescendingExercise(basePath:readonly FretboardNote[],type:ExerciseType):readonly ExerciseNote[]{return create([...basePath].reverse(),type)}
