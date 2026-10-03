import {afterEach,describe,it,expect,vi} from 'vitest';
import {api,ApiError} from '../lib/client/api';
afterEach(()=>vi.unstubAllGlobals());
describe('API client',()=>{
 it('returns successful data',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({data:{id:'saved'}})));expect(await api('/saves','POST',{})).toEqual({id:'saved'});});
 it('surfaces a validation error',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({error:{code:'INVALID_ACTION',message:'Ya utilizaste todos tus tiros.'}},{status:422})));await expect(api('/games')).rejects.toMatchObject({status:422,code:'INVALID_ACTION'});});
 it('handles non-JSON responses',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('unavailable',{status:503})));await expect(api('/games')).rejects.toMatchObject({code:'BAD_RESPONSE'});});
 it('handles network failure without claiming success',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('offline')));await expect(api('/games')).rejects.toMatchObject({code:'NETWORK',status:0});});
});
