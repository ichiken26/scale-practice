import type { PracticeRound,PracticeSettings,ScaleCombination } from '../domain/types'
import type { WorkerRequest,WorkerResponse } from './protocol'
export class ExerciseWorkerClient{
  private readonly worker:Worker;private nextId=0;private pending=new Map<number,{resolve:(round:PracticeRound)=>void;reject:(error:Error)=>void}>();private latestAccepted=0
  constructor(worker:Worker=new Worker(new URL('./exercise.worker.ts',import.meta.url),{type:'module'})){this.worker=worker;worker.onmessage=(e:MessageEvent<WorkerResponse>)=>this.handle(e.data);worker.onerror=()=>this.rejectAll(new Error('Exercise worker failed'))}
  init(settings:PracticeSettings):Promise<void>{const id=++this.nextId;return new Promise((resolve,reject)=>{const handler=(e:MessageEvent<WorkerResponse>)=>{if(e.data.requestId!==id)return;if(e.data.type==='READY'){this.worker.removeEventListener('message',handler);resolve()}else if(e.data.type==='ERROR'){this.worker.removeEventListener('message',handler);reject(new Error(e.data.message))}};this.worker.addEventListener('message',handler);this.worker.postMessage({type:'INIT_SESSION',requestId:id,settings} satisfies WorkerRequest)})}
  generateNext(previousCombination?:ScaleCombination|null):Promise<PracticeRound>{const requestId=++this.nextId;return new Promise((resolve,reject)=>{this.pending.set(requestId,{resolve,reject});this.worker.postMessage({type:'GENERATE_NEXT',requestId,...(previousCombination===undefined?{}:{previousCombination})} satisfies WorkerRequest)})}
  dispose():void{this.rejectAll(new Error('Exercise worker disposed'));this.worker.terminate()}
  private handle(response:WorkerResponse):void{if(response.type==='READY')return;const item=this.pending.get(response.requestId);if(!item)return;this.pending.delete(response.requestId);if(response.requestId<this.latestAccepted){item.reject(new Error('Stale worker response'));return}if(response.type==='ROUND_GENERATED'){this.latestAccepted=response.requestId;item.resolve(response.round)}else item.reject(new Error(response.type==='ERROR'?response.message:response.reason))}
  private rejectAll(error:Error):void{for(const p of this.pending.values())p.reject(error);this.pending.clear()}
}
