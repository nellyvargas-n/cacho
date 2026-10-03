export class ApiError extends Error {constructor(message:string,public status:number,public code:string){super(message);}}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
 try {const res=await fetch('/api/v1'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
 let raw:unknown;try{raw=await res.json();}catch{throw new ApiError('El servidor no respondió correctamente. Inténtalo nuevamente.',res.status,'BAD_RESPONSE');}
 if(!raw||typeof raw!=='object')throw new ApiError('La respuesta no es válida.',res.status,'BAD_RESPONSE');
 const payload=raw as {data?:T;error?:{message?:string;code?:string}};
 if(!res.ok)throw new ApiError(payload.error?.message||'No se pudo completar la operación.',res.status,payload.error?.code||'UNKNOWN');
 if(!('data' in payload))throw new ApiError('La respuesta no contiene datos.',res.status,'BAD_RESPONSE');return payload.data as T;
 }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('No se pudo confirmar la operación. Revisa tu conexión y actualiza la partida antes de continuar.',0,'NETWORK');}finally{clearTimeout(timer);}
}
