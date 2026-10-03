import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {env} from './cloudflare-env';
import {create,act,save,listSaves,restore,removeSave,ranking,endpoint,getGame} from '../lib/server/service';
import {CATEGORIES,type Game} from '../lib/game/engine';
let sqlite:DatabaseSync;
function req(path:string,body?:unknown,user='alice'){return new Request('https://game.test'+path,{method:body===undefined?'GET':'POST',headers:{'oai-authenticated-user-id':user,'Content-Type':'application/json','Origin':'https://game.test'},body:body===undefined?undefined:JSON.stringify(body)});}
const setup=()=>create(req('/games',{names:['Nelly','Diego'],mode:'alalay',opponent:'human'}));
beforeEach(() => {
 sqlite = new DatabaseSync(':memory:');
 sqlite.exec(readFileSync(new URL('../drizzle/0000_dry_warhawk.sql', import.meta.url), 'utf8'));
 env.DB = {
   prepare(sql: string) {
     return {
       bind(...values: (string | number | null)[]) {
         const st = sqlite.prepare(sql);
         return {
           async first() { return st.get(...values) || null; },
           async all() { return { results: st.all(...values) }; },
           async run() { const result = st.run(...values); return { meta: { changes: Number(result.changes) } }; }
         };
       }
     };
   }
 };
});
afterEach(()=>sqlite.close());
describe('Persistent API with SQLite',()=>{
 it('creates and reads an owned game',async()=>{const g=await setup();expect((await getGame(g.id,'alice')).players[0].name).toBe('Nelly');});
 it('blocks another owner',async()=>{const g=await setup();await expect(getGame(g.id,'bob')).rejects.toMatchObject({status:404});});
 it('rejects unauthenticated requests',async()=>{const r=await endpoint(create)(new Request('https://game.test/games',{method:'POST'}));expect(r.status).toBe(401);});
 it('rejects cross-origin writes',async()=>{const r=await endpoint(create)(new Request('https://game.test/games',{method:'POST',headers:{origin:'https://other.test'}}));expect(r.status).toBe(403);});
 it('deduplicates actions and rejects stale versions',async()=>{const g=await setup();const body={actionId:crypto.randomUUID(),expectedVersion:0,action:{type:'ROLL'}};const first=await act(req('/action',body),g.id);const second=await act(req('/action',body),g.id);expect(second).toEqual(first);expect(first.rolls).toBe(1);await expect(act(req('/action',{...body,actionId:crypto.randomUUID()}),g.id)).rejects.toMatchObject({status:409});});
 it('handles a simultaneous duplicate only once',async()=>{const g=await setup(),body={actionId:crypto.randomUUID(),expectedVersion:0,action:{type:'ROLL'}};const [a,b]=await Promise.all([act(req('/action',body),g.id),act(req('/action',body),g.id)]);expect(a).toEqual(b);expect((await getGame(g.id,'alice')).version).toBe(1);});
 it('saves, restores and deletes a snapshot',async()=>{const g=await setup();const s=await save(req('/saves',{gameId:g.id,name:'Prueba',expectedVersion:0}));await act(req('/action',{actionId:crypto.randomUUID(),expectedVersion:0,action:{type:'ROLL'}}),g.id);const restored=await restore(req('/restore',{}),s.id);expect(restored.rolls).toBe(0);expect(restored.version).toBe(2);expect((await listSaves(req('/saves'))).length).toBe(1);await removeSave(req('/save',{}),s.id);expect(await listSaves(req('/saves'))).toEqual([]);});
 it('does not expose saves to another owner',async()=>{const g=await setup(),s=await save(req('/saves',{gameId:g.id,name:'Private',expectedVersion:0}));expect(await listSaves(req('/saves',undefined,'bob'))).toEqual([]);await expect(restore(req('/restore',{},'bob'),s.id)).rejects.toMatchObject({status:404});});
 it('records a finished match and prevents rollback of its result',async()=>{let g=await setup();const s=await save(req('/saves',{gameId:g.id,name:'Opening',expectedVersion:0}));for(const c of CATEGORIES){for(let player=0;player<2;player++){g=await act(req('/a',{actionId:crypto.randomUUID(),expectedVersion:g.version,action:{type:'ROLL'}}),g.id) as Game;g=await act(req('/a',{actionId:crypto.randomUUID(),expectedVersion:g.version,action:{type:'SCORE',category:c.id}}),g.id) as Game;}}expect(g.status).toBe('finished');const rows=await ranking(req('/ranking'));expect(rows.length).toBeGreaterThan(0);expect((await restore(req('/restore',{}),s.id)).status).toBe('finished');expect(await ranking(req('/ranking'))).toEqual(rows);});
});
