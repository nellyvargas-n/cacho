import {endpoint,create,listGames} from '@/lib/server/service';
export const POST=endpoint(create);
export const GET=endpoint(listGames);
