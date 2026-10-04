// Original procedural music and dice effects. No downloads or external audio services.
type Preferences={music:boolean;sound:boolean;volume:number};
export class GameAudio {
 private context:AudioContext|null=null;
 private musicGain:GainNode|null=null;
 private effectsGain:GainNode|null=null;
 private musicNodes=new Set<AudioScheduledSourceNode>();
 private effectNodes=new Set<AudioScheduledSourceNode>();
 private timer:ReturnType<typeof setInterval>|null=null;
 private nextBeat=0;
 private beat=0;
 private hidden=false;
 private disposed=false;
 private preferences:Preferences={music:true,sound:true,volume:22};

 configure(preferences:Preferences){
  this.preferences=preferences;
  if(this.context&&this.musicGain&&this.effectsGain){
   this.musicGain.gain.setTargetAtTime(preferences.music?preferences.volume/100:0,this.context.currentTime,.03);
   this.effectsGain.gain.setTargetAtTime(preferences.sound?.65:0,this.context.currentTime,.015);
  }
  if(!preferences.sound)this.stopNodes(this.effectNodes);
  this.syncMusic();
 }
 unlock(){
  if(this.disposed||this.hidden)return;
  try{
   if(!this.context){
    const Constructor=globalThis.AudioContext||(globalThis as typeof globalThis&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!Constructor)return;
    this.context=new Constructor();
    this.musicGain=this.context.createGain();this.effectsGain=this.context.createGain();
    this.musicGain.connect(this.context.destination);this.effectsGain.connect(this.context.destination);
    this.configure(this.preferences);
   }
   void this.context.resume().then(()=>{if(!this.disposed)this.syncMusic();}).catch(()=>{});
  }catch{/* Audio must never interrupt a game. */}
 }
 setHidden(hidden:boolean){
  this.hidden=hidden;
  if(hidden){this.stopMusic();this.stopNodes(this.effectNodes);void this.context?.suspend().catch(()=>{});}
  else if(this.context)this.unlock();
 }
 private stopNodes(nodes:Set<AudioScheduledSourceNode>){for(const node of nodes){try{node.stop();node.disconnect();}catch{}}nodes.clear();}
 private stopMusic(){if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.stopNodes(this.musicNodes);}
 private track(source:AudioScheduledSourceNode,gain:GainNode,music:boolean){
  const nodes=music?this.musicNodes:this.effectNodes;nodes.add(source);
  source.onended=()=>{nodes.delete(source);source.disconnect();gain.disconnect();};
 }
 private tone(frequency:number,time:number,length:number,level:number,music:boolean){
  const ctx=this.context!,destination=music?this.musicGain!:this.effectsGain!;
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();
  oscillator.type=music?'triangle':'sine';oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(level,time+.015);
  gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  oscillator.connect(gain);gain.connect(destination);this.track(oscillator,gain,music);
  oscillator.start(time);oscillator.stop(time+length+.02);
 }
 private syncMusic(){
  if(this.disposed||this.hidden||!this.preferences.music||this.preferences.volume===0){this.stopMusic();return;}
  if(!this.context||this.context.state!=='running'||this.timer!==null)return;
  this.nextBeat=this.context.currentTime+.05;
  const melody=[69,72,76,79,76,72,67,72,69,72,74,76,74,72,67,64,65,69,72,76,72,69,64,69,67,71,74,79,74,71,67,64];
  const frequency=(midi:number)=>440*2**((midi-69)/12);
  const schedule=()=>{
   const ctx=this.context;if(!ctx||ctx.state!=='running')return;
   if(this.nextBeat<ctx.currentTime)this.nextBeat=ctx.currentTime+.05;
   while(this.nextBeat<ctx.currentTime+.25){
    this.tone(frequency(melody[this.beat%melody.length]),this.nextBeat,.65,.17,true);
    if(this.beat%4===0)this.tone(frequency([45,48,41,43][Math.floor(this.beat/8)%4]),this.nextBeat,1.25,.22,true);
    this.beat++;this.nextBeat+=.34;
   }
  };
  schedule();this.timer=setInterval(schedule,100);
 }
 effect(kind:'roll'|'score'){
  if(!this.preferences.sound||this.hidden||!this.context||this.context.state!=='running')return;
  try{
   const ctx=this.context,time=ctx.currentTime;
   if(kind==='score'){[523.25,659.25,783.99].forEach((f,i)=>this.tone(f,time+i*.085,.25,.13,false));return;}
   // Short filtered noise bursts and low knocks evoke five dice hitting wood.
   const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.065),ctx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.014));
   [0,.045,.10,.18,.29,.43,.57,.71].forEach((offset,i)=>{
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=buffer;source.playbackRate.value=.8+(i%4)*.15;
    filter.type='bandpass';filter.frequency.value=1100+(i%3)*430;filter.Q.value=.7;
    gain.gain.value=.42-i*.035;source.connect(filter);filter.connect(gain);gain.connect(this.effectsGain!);
    this.track(source,gain,false);const cleanup=source.onended;
    source.onended=event=>{filter.disconnect();cleanup?.call(source,event);};
    source.start(time+offset);source.stop(time+offset+.10);
    this.tone(155+i*13,time+offset,.055,.10-i*.008,false);
   });
  }catch{/* An unavailable output device must not affect the roll. */}
 }
 dispose(){this.disposed=true;this.stopMusic();this.stopNodes(this.effectNodes);void this.context?.close().catch(()=>{});this.context=null;}
}
