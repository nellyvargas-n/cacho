import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Cacho Alalay · El juego de siempre',description:'Tira, voltea y gana. Juega cacho con amigos o contra la computadora, guarda tus partidas y celebra cada victoria.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>){return <html lang="es"><body>{children}</body></html>}
