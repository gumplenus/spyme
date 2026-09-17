import type { ReactNode } from 'react';
import './globals.css';
import { AssistantWidget } from '@/components/AssistantWidget';

export const metadata = {
  title: 'SpyMe',
  description: 'Шпионский триллер. Допуск только по легенде.',
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
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}