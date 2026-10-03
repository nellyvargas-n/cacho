import {endpoint,removeSave} from '@/lib/server/service';
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return endpoint(r=>removeSave(r,id))(req);}
