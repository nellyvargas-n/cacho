import {endpoint,act} from '@/lib/server/service';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return endpoint(r=>act(r,id))(req);}
