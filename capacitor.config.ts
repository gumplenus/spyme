import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.spyme.app',
  appName: 'SpyMe',
  webDir: 'public',
  backgroundColor: '#050807',
  server: {
    url: 'https://spyme.com.ru',
    cleartext: true,
    allowNavigation: [
      'spyme.com.ru',
      '*.supabase.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // <-- ИЗМЕНЕНО: заставка висит, пока React не скроет её сам
      backgroundColor: "#050807",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'native', // <-- ИЗМЕНЕНО ЗДЕСЬ
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;