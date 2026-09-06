import type { Metadata } from 'next';
import './globals.css';
import { getActiveEvent } from '@/config/event';

export async function generateMetadata(): Promise<Metadata> {
  const event = getActiveEvent();
  return {
    title: `${event.title} | Entradas Digitales Oficiales`,
    description: `${event.subtitle}. Adquiere tus entradas por Pago Móvil.`,
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#09080e] text-zinc-100 selection:bg-pink-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
