'use client';
const POS:Record<number,number[]>={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
export default function Dice({value,held=false,disabled=false,rolling=false,onClick,small=false,label}:{value:number;held?:boolean;disabled?:boolean;rolling?:boolean;onClick?:()=>void;small?:boolean;label?:string}){
 const spots=Array.from({length:9},(_,i)=><i key={i} className={POS[value]?.includes(i)?'pip':'blank'} />);
 return onClick?<button type="button" className={`die ${held?'held':''} ${rolling?'rolling':''} ${small?'small':''}`} onClick={onClick} disabled={disabled} aria-pressed={held} aria-label={label||`Dado ${value}${held?', conservado':''}`}>{spots}</button>:<span className={`die ${small?'small':''} ${rolling?'rolling':''}`} role="img" aria-label={`Dado ${value}`}>{spots}</span>;
}
