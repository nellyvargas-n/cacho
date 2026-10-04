# Cacho Alalay

Juego web funcional en React y TypeScript, inspirado en la referencia visual del usuario. Incluye humano contra humano en un dispositivo, rival automático, tres modalidades, guardados, recuperación, ranking, sonido y diseño adaptable.

## Arquitectura real de esta entrega

- React 19 y Vinext sobre Vite; interfaz en `components/game/`.
- Motor puro en `lib/game/engine.ts`, reglas y contratos validados con Zod.
- API REST en `app/api/v1/`, lógica y autorización en `lib/server/service.ts`.
- Persistencia D1 (SQLite) y migraciones Drizzle; la versión alojada no utiliza Express ni PostgreSQL.
- Vitest: motor, solicitudes, interfaz y servicio con SQLite real en memoria.
- Errores HTTP centralizados, try/catch/finally en acciones y ErrorBoundary React.
- Identidad de la plataforma a través de cabeceras autenticadas, autorización por propietario.

## Desarrollo

Requiere Node.js 24 y pnpm. Ejecutar `pnpm install`, `pnpm test`, `pnpm run typecheck`, `pnpm run build`.
El entorno de publicación administra la base de datos y el inicio de sesión. Para un servidor externo se debe adaptar la identidad y el enlace D1; no se deben aceptar cabeceras de identidad del cliente sin un proxy autenticado confiable.

## API

- GET /api/v1/games: última partida activa del usuario.
- POST /api/v1/games: crea partida.
- GET /api/v1/games/:id: estado actual.
- POST /api/v1/games/:id/actions: acción, UUID de solicitud y versión esperada.
- GET y POST /api/v1/saves: listar y crear puntos de recuperación.
- POST /api/v1/saves/:id/restore: recuperar.
- DELETE /api/v1/saves/:id: eliminar punto de recuperación.
- GET /api/v1/ranking: ganadores de partidas terminadas del usuario.

Cada movimiento se persiste. El control de versión impide movimientos simultáneos y el identificador de acción reconoce reintentos inmediatos. La computadora ejecuta un turno válido en el servidor. El resultado de los dados se genera con Web Crypto y rechazo para evitar sesgo modular.

## Reglas de la casa, versión 1

La referencia no especificaba las reglas completas. Esta edición usa 10 casillas: seis sumas por cara, escalera 20 (12345, 23456, 13456), full 30, póker 40 (cuatro o cinco iguales), grande 50. Escalera/full/póker servidos en primer tiro sin volteo suman 5. Grande no implica victoria instantánea. Un volteo cambia un solo dado a 7 menos su cara. Tiro volteo: 1 tiro/1 volteo; Alalay: 2/2; Triplete: 3/0. Cada persona completa las 10 casillas. Los empates se conservan.

## Guardados

En la nube se guarda un snapshot completo del turno. Recuperar una partida terminada muestra el resultado final y no revierte la clasificación. Desmarcar nube crea un acceso local al progreso actual, no una partida sin conexión; se informa en el diálogo. No hay multijugador remoto. El ranking empieza vacío y contiene resultados reales.

## Recursos visuales

`public/andes.png` es una ilustración original generada para esta aplicación. La interfaz y los dados son componentes interactivos. Favicon propio.
