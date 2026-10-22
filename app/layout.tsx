import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import './globals.css';
import { AssistantWidget } from '@/components/AssistantWidget';
import { ViewportResizeObserver } from '@/components/ViewportResizeObserver';

export const metadata = {
  title: 'SpyMe',
  description: 'Шпионский триллер. Допуск только по легенде.',
};

// Этот блок исправляет вёрстку чата на мобильных при клавиатуре
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content', 
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-neon antialiased">
        <ViewportResizeObserver />
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}