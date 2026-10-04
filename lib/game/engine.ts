export const CATEGORIES = [
  {id:'ones',label:'Balas',face:1},{id:'twos',label:'Tontos',face:2},
  {id:'threes',label:'Trenes',face:3},{id:'fours',label:'Cuadras',face:4},
  {id:'fives',label:'Quinas',face:5},{id:'sixes',label:'Senas',face:6},
  {id:'straight',label:'Escalera',face:0},{id:'full',label:'Full',face:0},
  {id:'poker',label:'Póker',face:0},{id:'grande',label:'Grande',face:0},
] as const;
export type Category = typeof CATEGORIES[number]['id'];
export type Mode = 'tiro'|'alalay'|'triplete';
export type Opponent = 'human'|'computer';
export const RULES = {
  tiro:{label:'Tiro volteo',rolls:1,flips:1,description:'1 tiro · 1 volteo'},
  alalay:{label:'Alalay',rolls:2,flips:2,description:'2 tiros · 2 volteos'},
  triplete:{label:'Triplete',rolls:3,flips:0,description:'3 tiros · sin volteos'},
};
export type Player = {name:string;avatar:string;score:Partial<Record<Category,number>>};
export type CpuStep = {type:'ROLL'|'FLIP';dice:number[];held:boolean[];rolls:number;flips:number};
export type CpuTurn = {turn:number;steps:CpuStep[];dice:number[];category:Category;points:number};
export type Game = {id:string;mode:Mode;opponent:Opponent;players:Player[];current:number;dice:number[];held:boolean[];rolls:number;flips:number;turn:number;version:number;status:'playing'|'finished';createdAt:string;updatedAt:string;lastEvent:string;rulesVersion:1;lastCpuTurn?:CpuTurn};
export type Action = {type:'ROLL'}|{type:'HOLD';index:number}|{type:'FLIP';index:number}|{type:'SCORE';category:Category}|{type:'CPU'};
export class GameError extends Error { constructor(message:string,public code='INVALID_ACTION',public status=422){super(message);} }
export function createGame(id:string,names:string[],mode:Mode,opponent:Opponent,avatars=['🧑🏽','👩🏽']):Game {
 const now=new Date().toISOString();
 return {id,mode,opponent,players:names.map((name,i)=>({name,avatar:opponent==='computer'&&i===1?'🤖':avatars[i]||'🧑🏽',score:{}})),current:0,dice:[1,1,1,1,1],held:[false,false,false,false,false],rolls:0,flips:0,turn:0,version:0,status:'playing',createdAt:now,updatedAt:now,lastEvent:'¡Que empiece la partida!',rulesVersion:1};
}
export const total=(p:Player)=>Object.values(p.score).reduce((a,b)=>a+(b??0),0);
export function scoreDice(dice:number[],category:Category,served=false):number {
 if(dice.length!==5||dice.some(x=>!Number.isInteger(x)||x<1||x>6))throw new GameError('Los dados no son válidos.');
 const face=CATEGORIES.find(c=>c.id===category)?.face;
 if(face)return dice.filter(d=>d===face).length*face;
 const counts=Object.values(dice.reduce<Record<number,number>>((a,d)=>{a[d]=(a[d]||0)+1;return a;},{})).sort((a,b)=>b-a);
 const sorted=[...new Set(dice)].sort().join('');
 const bonus=served?5:0;
 if(category==='straight')return ['12345','23456','13456'].includes(sorted)?20+bonus:0;
 if(category==='full')return counts[0]===3&&counts[1]===2?30+bonus:0;
 if(category==='poker')return counts[0]>=4?40+bonus:0;
 if(category==='grande')return counts[0]===5?50:0;
 throw new GameError('Casilla desconocida.');
}
export function availableScores(g:Game){return CATEGORIES.map(c=>({...c,value:g.rolls?scoreDice(g.dice,c.id,g.rolls===1&&g.flips===0):0,used:g.players[g.current].score[c.id]!==undefined}));}
function step(g:Game,action:Exclude<Action,{type:'CPU'}>,die:()=>number):Game {
 const n=structuredClone(g),rules=RULES[n.mode];
 if(n.status==='finished')throw new GameError('La partida ya terminó.');
 if(action.type==='ROLL'){
  if(n.rolls>=rules.rolls)throw new GameError('Ya utilizaste todos tus tiros.');
  if(n.rolls>0&&n.held.every(Boolean))throw new GameError('Libera al menos un dado para lanzar.');
  n.dice=n.dice.map((v,i)=>n.rolls>0&&n.held[i]?v:die());n.rolls++;n.lastEvent=`${n.players[n.current].name} lanzó los dados.`;
 }else if(action.type==='HOLD'||action.type==='FLIP'){
  if(!n.rolls)throw new GameError('Lanza los dados primero.');
  if(!Number.isInteger(action.index)||action.index<0||action.index>4)throw new GameError('Selecciona un dado válido.');
  if(action.type==='HOLD'){n.held[action.index]=!n.held[action.index];}
  else {if(n.flips>=rules.flips)throw new GameError('Ya utilizaste todos tus volteos.');n.dice[action.index]=7-n.dice[action.index];n.flips++;n.lastEvent='Dado volteado a su cara opuesta.';}
 }else if(action.type==='SCORE'){
  if(!n.rolls)throw new GameError('Debes lanzar antes de anotar.');
  if(n.players[n.current].score[action.category]!==undefined)throw new GameError('Esta casilla ya está ocupada.');
  const points=scoreDice(n.dice,action.category,n.rolls===1&&n.flips===0);
  n.players[n.current].score[action.category]=points;
  n.lastEvent=`${n.players[n.current].name}: ${points} puntos en ${CATEGORIES.find(c=>c.id===action.category)?.label}.`;
  n.turn++;
  if(n.players.every(p=>Object.keys(p.score).length===CATEGORIES.length)){n.status='finished';}
  else {n.current=1-n.current;n.dice=[1,1,1,1,1];n.held=[false,false,false,false,false];n.rolls=0;n.flips=0;}
 }
 return n;
}
function cpuTurn(g:Game,die:()=>number):Game{
 let n=structuredClone(g),rules=RULES[n.mode];
 const steps:CpuStep[]=[];
 const record=(type:CpuStep['type'])=>steps.push({type,dice:[...n.dice],held:[...n.held],rolls:n.rolls,flips:n.flips});
 if(!n.rolls)n=step(n,{type:'ROLL'},die);
 record('ROLL');
 while(n.rolls<rules.rolls){
  const options=availableScores(n).filter(x=>!x.used);
  if(options.some(x=>x.face===0&&x.value>=30))break;
  const counts=[1,2,3,4,5,6].map(face=>({face,count:n.dice.filter(d=>d===face).length})).sort((a,b)=>b.count-a.count||b.face-a.face);
  n.held=n.dice.map(d=>d===counts[0].face);if(n.held.every(Boolean))break;
  n=step(n,{type:'ROLL'},die);
  record('ROLL');
 }
 while(n.flips<rules.flips){
  const best=()=>Math.max(...availableScores(n).filter(x=>!x.used).map(x=>x.value));
  let value=best(),index=-1;
  for(let i=0;i<5;i++){const t=step(n,{type:'FLIP',index:i},die);const v=Math.max(...availableScores(t).filter(x=>!x.used).map(x=>x.value));if(v>value){value=v;index=i;}}
  if(index<0)break;n=step(n,{type:'FLIP',index},die);record('FLIP');
 }
 const options=availableScores(n).filter(x=>!x.used).sort((a,b)=>b.value-a.value||(a.face||10)-(b.face||10));
 const result:CpuTurn={turn:g.turn,steps,dice:[...n.dice],category:options[0].id,points:options[0].value};
 n=step(n,{type:'SCORE',category:result.category},die);
 n.lastCpuTurn=result;
 return n;
}
export function applyAction(g:Game,action:Action,die:()=>number):Game {
 if(g.status==='finished')throw new GameError('La partida ya terminó.');
 const isCPU=g.opponent==='computer'&&g.current===1;
 if(action.type==='CPU'&&!isCPU)throw new GameError('Ahora es el turno de una persona.');
 if(action.type!=='CPU'&&isCPU)throw new GameError('Es el turno de la computadora.');
 const n=action.type==='CPU'?cpuTurn(g,die):step(g,action,die);
 n.version=g.version+1;n.updatedAt=new Date().toISOString();return n;
}
