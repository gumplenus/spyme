import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.spyme.app',
  appName: 'SpyMe',
  webDir: 'public',
  backgroundColor: '#050807', // <--- ВОТ ЭТА СТРОЧКА БЫЛА ПРОПУЩЕНА
  server: {
    url: 'https://spyme.com.ru',
    cleartext: true
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
    }
  }
};

export default config;