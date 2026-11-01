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
      launchAutoHide: true,
      backgroundColor: "#050807",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;