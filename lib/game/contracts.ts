import { z } from 'zod';
export const createSchema=z.object({names:z.tuple([z.string().trim().min(1).max(24),z.string().trim().min(1).max(24)]),mode:z.enum(['tiro','alalay','triplete']),opponent:z.enum(['human','computer']),avatars:z.tuple([z.enum(['🧑🏽','👩🏽','👨🏻','👩🏻','🧔🏽','👩🏾']),z.enum(['🧑🏽','👩🏽','👨🏻','👩🏻','🧔🏽','👩🏾'])]).optional()});
export const actionSchema=z.object({actionId:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),action:z.discriminatedUnion('type',[
 z.object({type:z.literal('ROLL')}),z.object({type:z.literal('HOLD'),index:z.number().int().min(0).max(4)}),z.object({type:z.literal('FLIP'),index:z.number().int().min(0).max(4)}),z.object({type:z.literal('CPU')}),z.object({type:z.literal('SCORE'),category:z.enum(['ones','twos','threes','fours','fives','sixes','straight','full','poker','grande'])})])});
export const saveSchema=z.object({gameId:z.string().uuid(),name:z.string().trim().min(1).max(60),expectedVersion:z.number().int().nonnegative()});
