// @vitest-environment jsdom
import React from 'react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,waitFor,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CachoApp from '../components/game/CachoApp';
import {createGame,applyAction,type Game} from '../lib/game/engine';
import {api} from '../lib/client/api';
vi.mock('../lib/client/api',()=>({api:vi.fn(),ApiError:class extends Error{status=0;}}));
let game:Game;
beforeEach(()=>{vi.stubGlobal('ResizeObserver',class{observe(){} unobserve(){} disconnect(){}});localStorage.clear();localStorage.setItem('cacho-sound','false');localStorage.setItem('cacho-motion','false');vi.mocked(api).mockReset();vi.mocked(api).mockImplementation(async(path,method='GET',body)=>{const b=body as any;if(path==='/games'&&method==='GET')return [];if(path==='/games'&&method==='POST'){game=createGame(crypto.randomUUID(),b.names,b.mode,b.opponent,b.avatars);return game;}if(path.endsWith('/actions')){game=applyAction(game,b.action,()=>3);return game;}if(path.startsWith('/games/'))return game;if(path==='/saves'&&method==='POST')return {id:'saved'};return [];});});
afterEach(cleanup);
describe('React game journey',()=>{
 it('remembers independent music, volume and dice sound controls',async()=>{
  const u=userEvent.setup();render(<CachoApp/>);
  await u.click(screen.getByRole('button',{name:'Apagar música'}));
  expect(localStorage.getItem('cacho-music')).toBe('false');
  await u.click(screen.getByRole('button',{name:'Configuración'}));
  expect(screen.getByRole('switch',{name:'Música de fondo'}).getAttribute('aria-checked')).toBe('false');
  expect(screen.getByRole('switch',{name:'Sonidos del juego'}).getAttribute('aria-checked')).toBe('false');
  await u.click(screen.getByRole('switch',{name:'Sonidos del juego'}));
  expect(localStorage.getItem('cacho-sound')).toBe('true');
  expect(localStorage.getItem('cacho-music')).toBe('false');
  await u.click(screen.getByRole('button',{name:'Listo'}));cleanup();render(<CachoApp/>);
  await screen.findByRole('button',{name:'Activar música'});
  expect(screen.getByRole('button',{name:'Silenciar efectos'})).toBeTruthy();
 });
 it('configures, rolls, scores and saves a human match',async()=>{const u=userEvent.setup();render(<CachoApp/>);await u.click(screen.getByRole('button',{name:'Jugar'}));await u.click(screen.getByRole('button',{name:/ENTRE AMIGOS/}));expect(screen.getByRole('textbox',{name:'Jugador 1'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Comenzar'}));await screen.findByRole('button',{name:'Lanzar dados'});await u.click(screen.getByRole('button',{name:'Lanzar dados'}));const score=await screen.findByRole('button',{name:'Anotar 15 puntos en Trenes para Nelly'});await waitFor(()=>expect(score.hasAttribute('disabled')).toBe(false));await u.click(score);await screen.findByRole('heading',{name:'Turno de Diego'});await u.click(screen.getByRole('button',{name:'Guardar partida'}));await screen.findByRole('dialog');await u.click(screen.getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(vi.mocked(api).mock.calls.some(([p,m])=>p==='/saves'&&m==='POST')).toBe(true);});
 it('runs the computer turn after the human scores',async()=>{const u=userEvent.setup();render(<CachoApp/>);await u.click(screen.getByRole('button',{name:'Jugar'}));await u.click(screen.getByRole('button',{name:/ACEPTA EL RETO/}));await u.click(screen.getByRole('button',{name:'Comenzar'}));await screen.findByRole('button',{name:'Lanzar dados'});await u.click(screen.getByRole('button',{name:'Lanzar dados'}));const score=await screen.findByRole('button',{name:'Anotar 15 puntos en Trenes para Nelly'});await waitFor(()=>expect(score.hasAttribute('disabled')).toBe(false));await u.click(score);await waitFor(()=>expect(game.turn).toBe(2),{timeout:3500});expect(game.current).toBe(0);expect(Object.keys(game.players[1].score)).toHaveLength(1);
 const botDie=await screen.findByRole('button',{name:'Dado del bot 1: 3. Resultado de la computadora'},{timeout:2000});
 expect(botDie.hasAttribute('disabled')).toBe(true);
 expect(screen.getByRole('button',{name:'Juega la computadora'}).hasAttribute('disabled')).toBe(true);
 await screen.findByRole('heading',{name:'Turno de Nelly'},{timeout:4500});
 expect(screen.getByRole('complementary',{name:'Última jugada de la computadora'}).textContent).toContain('50 puntos');
 expect(screen.getByRole('img',{name:'Dado del bot 1: 3'})).toBeTruthy();
 },10000);
 it('shows API failures without losing the configuration',async()=>{const u=userEvent.setup();render(<CachoApp/>);await u.click(screen.getByRole('button',{name:'Jugar'}));await u.click(screen.getByRole('button',{name:/ENTRE AMIGOS/}));vi.mocked(api).mockRejectedValueOnce(new Error('Sin conexión'));await u.click(screen.getByRole('button',{name:'Comenzar'}));await screen.findByText('Sin conexión');expect((screen.getByRole('textbox',{name:'Jugador 1'}) as HTMLInputElement).value).toBe('Nelly');});
});
