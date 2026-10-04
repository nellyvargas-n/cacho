'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {CATEGORIES,type CpuStep,type CpuTurn} from '@/lib/game/engine';

export function useCpuReplay(){
 const [frame,setFrame]=useState<CpuStep|null>(null);
 const [message,setMessage]=useState('');
 const [rolling,setRolling]=useState(false);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const play=useCallback(async(turn:CpuTurn,motion:boolean,sound:(kind:'roll'|'score')=>void)=>{
  controller.current?.abort();
  const session=new AbortController();controller.current=session;
  const wait=(ms:number)=>new Promise<void>(resolve=>{
   const done=()=>{clearTimeout(timer);session.signal.removeEventListener('abort',done);resolve();};
   const timer=setTimeout(done,ms);session.signal.addEventListener('abort',done,{once:true});
   if(session.signal.aborted)done();
  });
  let previous:CpuStep={type:'ROLL',dice:[1,1,1,1,1],held:[false,false,false,false,false],rolls:0,flips:0};
  for(const step of turn.steps){
   if(session.signal.aborted)return false;
   const isRoll=step.type==='ROLL';
   setFrame({...previous,held:step.held});
   setMessage(isRoll?`La computadora lanza · Tiro ${step.rolls}`:`La computadora voltea un dado · Volteo ${step.flips}`);
   setRolling(isRoll&&motion);
   if(isRoll)sound('roll');
   await wait(motion?(isRoll?900:350):150);
   if(session.signal.aborted)return false;
   setFrame(step);setRolling(false);
   setMessage(`${isRoll?'Tiro '+step.rolls:'Volteo '+step.flips}: ${step.dice.join(' · ')}`);
   await wait(1100);previous=step;
  }
  if(session.signal.aborted)return false;
  const category=CATEGORIES.find(c=>c.id===turn.category)?.label;
  setMessage(`La computadora anota ${turn.points} puntos en ${category}.`);sound('score');
  await wait(1800);
  if(session.signal.aborted)return false;
  setFrame(null);setMessage('');setRolling(false);controller.current=null;
  return true;
 },[]);
 return {frame,message,rolling,play};
}
