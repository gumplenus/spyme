'use client';

import { useEffect } from 'react';

export function ViewportResizeObserver() {
  useEffect(() => {
    function updateAppHeight() {
      try {
        if (typeof window !== 'undefined' && window.visualViewport) {
          // Устанавливаем реальную высоту экрана
          document.documentElement.style.setProperty('--app-height', `${window.visualViewport.height}px`);
          // ЖЕСТКО возвращаем страницу наверх, чтобы Safari не сдвигал шапку
          window.scrollTo(0, 0);
        } else {
          document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
        }
      } catch {}
    }

    updateAppHeight();
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;

    if (vv) {
      vv.addEventListener('resize', updateAppHeight);
      vv.addEventListener('scroll', updateAppHeight);
    }
    window.addEventListener('resize', updateAppHeight);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateAppHeight);
        vv.removeEventListener('scroll', updateAppHeight);
      }
      window.removeEventListener('resize', updateAppHeight);
    };
  }, []);

  return null;
}