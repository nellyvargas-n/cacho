import {endpoint,save,listSaves} from '@/lib/server/service';
export const GET=endpoint(listSaves);
export const POST=endpoint(save);
