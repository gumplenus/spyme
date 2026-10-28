'use client';

import { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export function SplashScreenController() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Даем интерфейсу 2 секунды (2000 мс) на отрисовку и прячем заставку
      const timer = setTimeout(() => {
        SplashScreen.hide().catch(() => {});
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}