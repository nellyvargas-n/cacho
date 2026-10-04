'use client';
import type {CSSProperties} from 'react';
const POS:Record<number,number[]>={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
// Opposite sides add up to seven; the result always faces the viewer.
const ROTATION:Record<number,[number,number]>={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
function Spots({value}:{value:number}){return <>{Array.from({length:9},(_,i)=><i key={i} className={POS[value]?.includes(i)?'pip':'blank'}/>)}</>}
export default function Dice({value,held=false,disabled=false,rolling=false,onClick,small=false,label,index=0}:{value:number;held?:boolean;disabled?:boolean;rolling?:boolean;onClick?:()=>void;small?:boolean;label?:string;index?:number}){
 const [x,y]=ROTATION[value]??ROTATION[1];
 const style={'--face-x':`${x}deg`,'--face-y':`${y}deg`,'--dice-delay':`${index*45}ms`} as CSSProperties;
 const className=small?'die small':`die dice-3d ${held?'held':''} ${rolling?'rolling':''}`;
 const content=small?<Spots value={value}/>:<><span className="die-shadow" aria-hidden/><span className="die-lift" aria-hidden><span className="die-cube">{[1,2,3,4,5,6].map(face=><span className={`die-face face-${face}`} key={face}><Spots value={face}/></span>)}</span></span></>;
 return onClick?<button type="button" className={className} style={style} onClick={onClick} disabled={disabled} aria-pressed={held} aria-label={label||`Dado ${value}${held?', conservado':''}`}>{content}</button>:<span className={className} style={style} role="img" aria-label={label||`Dado ${value}`}>{content}</span>;
}
