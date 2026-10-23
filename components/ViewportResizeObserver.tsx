'use client';

import { useEffect } from 'react';

export function ViewportResizeObserver() {
  useEffect(() => {
    function updateAppHeight() {
      try {
        if (typeof window !== 'undefined' && window.visualViewport) {
          // Устанавливаем переменную высоты экрана
          document.documentElement.style.setProperty('--app-height', `${window.visualViewport.height}px`);
        } else {
          document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
        }
      } catch {}
    }

    updateAppHeight();
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;

    if (vv) {
      vv.addEventListener('resize', updateAppHeight);
    }
    window.addEventListener('resize', updateAppHeight);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateAppHeight);
      }
      window.removeEventListener('resize', updateAppHeight);
    };
  }, []);

  return null;
}