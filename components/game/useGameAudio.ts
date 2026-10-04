'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {GameAudio} from '@/lib/client/game-audio';

export function useGameAudio(){
 const [sound,setSoundState]=useState(true),[music,setMusicState]=useState(true),[volume,setVolumeState]=useState(22);
 const audio=useRef<GameAudio|null>(null);
 useEffect(()=>{
  const player=new GameAudio();audio.current=player;
  try{
   setSoundState(localStorage.getItem('cacho-sound')!=='false');
   setMusicState(localStorage.getItem('cacho-music')!=='false');
   const saved=localStorage.getItem('cacho-music-volume'),v=Number(saved);
   if(saved!==null&&Number.isFinite(v))setVolumeState(Math.max(0,Math.min(100,v)));
  }catch{}
  const unlock=()=>player.unlock(),visibility=()=>player.setHidden(document.hidden);
  document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
  document.addEventListener('visibilitychange',visibility);visibility();
  return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);player.dispose();audio.current=null;};
 },[]);
 useEffect(()=>audio.current?.configure({sound,music,volume}),[sound,music,volume]);
 const store=(key:string,value:boolean|number)=>{try{localStorage.setItem(key,String(value));}catch{}};
 const setSound=(value:boolean)=>{setSoundState(value);store('cacho-sound',value);};
 const setMusic=(value:boolean)=>{setMusicState(value);store('cacho-music',value);};
 const setVolume=(value:number)=>{setVolumeState(value);store('cacho-music-volume',value);};
 const effect=useCallback((kind:'roll'|'score')=>audio.current?.effect(kind),[]);
 return {sound,music,volume,setSound,setMusic,setVolume,effect};
}
