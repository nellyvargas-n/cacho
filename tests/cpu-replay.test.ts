import {describe,it,expect} from 'vitest';
import {applyAction,createGame,scoreDice,type Mode} from '../lib/game/engine';
const cpuGame=(mode:Mode)=>({...createGame('cpu',['Persona','Computadora'],mode,'computer'),current:1,turn:1});

describe('Real computer dice history',()=>{
 it('keeps each actual roll, including conserved dice, before the next player resets the board',()=>{
  const input=cpuGame('triplete');
  const numbers=[1,2,3,4,6,6,6,2,3,6,6];let consumed=0;
  const result=applyAction(input,{type:'CPU'},()=>numbers[consumed++]);
  expect(result.lastCpuTurn?.steps.map(step=>step.dice)).toEqual([[1,2,3,4,6],[6,6,2,3,6],[6,6,6,6,6]]);
  expect(result.lastCpuTurn?.steps[1].held).toEqual([false,false,false,false,true]);
  expect(result.lastCpuTurn?.steps[2].held).toEqual([true,true,false,false,true]);
  expect(result.lastCpuTurn).toMatchObject({turn:1,dice:[6,6,6,6,6],category:'grande',points:50});
  expect(consumed).toBe(11);expect(result.dice).toEqual([1,1,1,1,1]);expect(result.current).toBe(0);
  expect(input.lastCpuTurn).toBeUndefined();expect(input.players[1].score).toEqual({});
 });
 it('records a flip as its real opposite face and applies the same score shown to the player',()=>{
  const dice=[1,6,6,6,2];let i=0;
  const result=applyAction(cpuGame('tiro'),{type:'CPU'},()=>dice[i++]);
  expect(result.lastCpuTurn?.steps.map(step=>step.type)).toEqual(['ROLL','FLIP']);
  expect(result.lastCpuTurn?.dice).toEqual([6,6,6,6,2]);
  const trace=result.lastCpuTurn!;
  expect(trace.points).toBe(scoreDice(trace.dice,trace.category,false));
  expect(result.players[1].score[trace.category]).toBe(trace.points);
  expect(JSON.parse(JSON.stringify(result)).lastCpuTurn).toEqual(trace);
 });
 it('accepts old saved games without a computer history',()=>{
  const old=JSON.parse(JSON.stringify(cpuGame('alalay')));
  expect(old.lastCpuTurn).toBeUndefined();
  const result=applyAction(old,{type:'CPU'},()=>3);
  expect(result.lastCpuTurn?.dice).toEqual([3,3,3,3,3]);
  const humanRoll=applyAction(result,{type:'ROLL'},()=>2);
  expect(humanRoll.lastCpuTurn).toEqual(result.lastCpuTurn);
 });
});
