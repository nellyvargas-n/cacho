import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {GameAudio} from '../lib/client/game-audio';

const parameter=()=>({value:0,setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),setTargetAtTime:vi.fn()});
const sources:Array<{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}>=[];
class FakeContext {
 static latest:FakeContext;
 state='running';currentTime=0;sampleRate=8000;destination={};
 constructor(){FakeContext.latest=this;}
 resume=vi.fn(async()=>{this.state='running';});
 suspend=vi.fn(async()=>{this.state='suspended';});
 close=vi.fn(async()=>{this.state='closed';});
 createGain(){return {gain:parameter(),connect:vi.fn(),disconnect:vi.fn()};}
 createOscillator(){const source={type:'sine',frequency:parameter(),connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};sources.push(source);return source;}
 createBufferSource(){const source={buffer:null,playbackRate:parameter(),connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};sources.push(source);return source;}
 createBiquadFilter(){return {type:'',frequency:parameter(),Q:parameter(),connect:vi.fn(),disconnect:vi.fn()};}
 createBuffer(_channels:number,length:number){return {getChannelData:()=>new Float32Array(length)};}
}
let player:GameAudio;
beforeEach(()=>{vi.useFakeTimers();sources.length=0;vi.stubGlobal('AudioContext',FakeContext);player=new GameAudio();});
afterEach(()=>{player.dispose();vi.useRealTimers();vi.unstubAllGlobals();});
describe('Independent music and dice audio',()=>{
 it('waits for interaction before creating audio',()=>{player.configure({music:true,sound:true,volume:22});expect(sources).toHaveLength(0);});
 it('plays dice with music disabled and stops the effect when effects are muted',async()=>{
  player.configure({music:false,sound:true,volume:22});player.unlock();await Promise.resolve();
  expect(sources).toHaveLength(0);player.effect('roll');expect(sources.length).toBeGreaterThan(0);
  const count=sources.length;player.configure({music:false,sound:false,volume:22});player.effect('roll');
  expect(sources).toHaveLength(count);expect(sources.every(source=>source.stop.mock.calls.length>=2)).toBe(true);
 });
 it('keeps music independent of effects and cancels it immediately',async()=>{
  player.configure({music:true,sound:false,volume:22});player.unlock();await Promise.resolve();
  const count=sources.length;expect(count).toBeGreaterThan(0);player.effect('roll');expect(sources).toHaveLength(count);
  player.configure({music:false,sound:false,volume:22});vi.advanceTimersByTime(2000);
  expect(sources).toHaveLength(count);expect(sources.every(source=>source.stop.mock.calls.length>=2)).toBe(true);
 });
 it('pauses when the tab is hidden and closes audio on unmount',async()=>{
  player.unlock();await Promise.resolve();player.setHidden(true);
  expect(FakeContext.latest.suspend).toHaveBeenCalled();
  const count=sources.length;vi.advanceTimersByTime(2000);expect(sources).toHaveLength(count);
  player.dispose();expect(FakeContext.latest.close).toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
});
