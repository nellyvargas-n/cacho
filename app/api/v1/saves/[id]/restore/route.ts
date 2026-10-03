import {endpoint,restore} from '@/lib/server/service';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return endpoint(r=>restore(r,id))(req);}
