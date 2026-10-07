import{describe,expect,it}from'vitest'
import{generateNextRound}from'../src/domain/practice/roundGenerator'
import{createSeededRng}from'../src/domain/random/rng'
import type{PracticeSettings,RoundGenerationState}from'../src/domain/types'
describe('round bag session state',()=>{it('does not repeat a position before its combination bag refills',()=>{const settings:PracticeSettings={instrument:'guitar',tuning:[40,45,50,55,59,64],root:0,scaleType:'major',exerciseType:'normal',mode:'randomPosition',bpm:100,seed:77},state:RoundGenerationState={scaleBag:[],previousCombination:null,positionBags:new Map()},rng=createSeededRng(77),seen=new Map<string,string[]>();for(let i=0;i<18;i++){const generated=generateNextRound({settings,rng,state}),key=`${generated.combination.root}:${generated.combination.scaleType}`,ids=seen.get(key)??[];ids.push(generated.paths[0]?.id??'');seen.set(key,ids)}for(const ids of seen.values())expect(new Set(ids).size).toBe(ids.length)})})
