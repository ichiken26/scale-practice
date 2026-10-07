import type { PracticeRound,PracticeSettings,ScaleCombination } from '../domain/types'
export type WorkerRequest=
  |{type:'INIT_SESSION';requestId:number;settings:PracticeSettings}
  |{type:'GENERATE_RANDOM_ROUND'|'GENERATE_FULL_NECK'|'GENERATE_NEXT';requestId:number;previousCombination?:ScaleCombination|null}
export type WorkerResponse=
  |{type:'READY';requestId:number}
  |{type:'ROUND_GENERATED';requestId:number;round:PracticeRound}
  |{type:'GENERATION_SKIPPED';requestId:number;reason:string}
  |{type:'ERROR';requestId:number;message:string}
