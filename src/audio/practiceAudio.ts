import type { ExerciseTimeline,InstrumentType } from '../domain/types'
import { tickToContextTime } from '../domain/timeline/timeline'
import practiceProcessorUrl from './worklets/practiceProcessor.ts?worker&url'
type PracticeNodeMessage={type:'LOAD_EVENTS';events:{frame:number;durationFrames:number;type:'metronome'|'note';midi?:number;accent?:boolean;instrument?:InstrumentType}[]}|{type:'CLEAR_EVENTS'}|{type:'SET_VOLUMES';metronome:number;reference:number}|{type:'STOP'}
export class PracticeAudioEngine{private context:AudioContext|null=null;private node:AudioWorkletNode|null=null
  async start(timeline:ExerciseTimeline,bpm:number,instrument:InstrumentType,volumes={metronome:.3,reference:.35}):Promise<{context:AudioContext;sessionStart:number}>{const context=this.context??new AudioContext({latencyHint:'interactive'});this.context=context;if(context.state!=='running')await context.resume();if(!this.node){await context.audioWorklet.addModule(practiceProcessorUrl);this.node=new AudioWorkletNode(context,'practice-processor',{outputChannelCount:[2]});this.node.connect(context.destination)}const sessionStart=context.currentTime+.12;this.node.port.postMessage({type:'SET_VOLUMES',...volumes} satisfies PracticeNodeMessage);const events=timeline.events.filter(e=>e.type==='note'||e.type==='metronome').map(e=>({...e.midi===undefined?{}:{midi:e.midi},...e.accent===undefined?{}:{accent:e.accent},frame:Math.round(tickToContextTime(e.tick,bpm,sessionStart)*context.sampleRate),durationFrames:Math.max(1,Math.round(e.durationTicks/960*60/bpm*context.sampleRate)),type:e.type as 'note'|'metronome',instrument}));this.node.port.postMessage({type:'LOAD_EVENTS',events} satisfies PracticeNodeMessage);return{context,sessionStart}}
  setVolumes(metronome:number,reference:number):void{this.node?.port.postMessage({type:'SET_VOLUMES',metronome,reference} satisfies PracticeNodeMessage)}
  stop():void{this.node?.port.postMessage({type:'STOP'} satisfies PracticeNodeMessage)}
  get audioContext():AudioContext|null{return this.context}
  async dispose():Promise<void>{this.stop();this.node?.disconnect();this.node=null;if(this.context)await this.context.close();this.context=null}
}
