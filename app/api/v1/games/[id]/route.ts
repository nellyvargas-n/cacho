import {endpoint,getGame,owner} from '@/lib/server/service';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return endpoint(r=>getGame(id,owner(r)))(req);}
