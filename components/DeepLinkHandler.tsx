'use client';

import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { useRouter } from 'next/navigation';

export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Слушаем событие возврата в приложение по кастомной ссылке
    const listener = CapacitorApp.addListener('appUrlOpen', async (event) => {
      // Если ссылка начинается с нашей схемы
      if (event.url.startsWith('spyme://auth/callback')) {
        
        // Закрываем системный браузер (Safari), если он открыт
        try {
          await Browser.close();
        } catch (e) {
          // Игнорируем ошибку, если браузер уже закрыт
        }

        // Извлекаем параметры (code, state и т.д.) из URL
        const urlObj = new URL(event.url);
        const queryString = urlObj.search;
        
        // Перенаправляем пользователя на нашу веб-страницу колбэка с этими параметрами
        router.push(`/auth/callback${queryString}`);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [router]);

  return null;
}