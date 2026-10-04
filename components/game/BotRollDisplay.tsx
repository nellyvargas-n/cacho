'use client';
import {Bot,Check} from 'lucide-react';
import {CATEGORIES,type CpuTurn} from '@/lib/game/engine';
import Dice from './Dice';
export default function BotRollDisplay({turn}:{turn:CpuTurn}){
 const label=CATEGORIES.find(c=>c.id===turn.category)?.label;
 return <aside className="bot-result" aria-label="Última jugada de la computadora">
  <div className="bot-result-title"><Bot size={19}/><strong>La computadora sacó</strong><span>Ronda {Math.floor(turn.turn/2)+1}</span></div>
  <div className="bot-result-dice">{turn.dice.map((value,i)=><Dice key={i} value={value} small label={`Dado del bot ${i+1}: ${value}`}/>)}<span>{turn.dice.join(' · ')}</span></div>
  <p><Check size={16}/><span>Anotó <strong>{turn.points} puntos</strong> en <strong>{label}</strong></span></p>
 </aside>;
}
