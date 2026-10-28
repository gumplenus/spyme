import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.spyme.app',
  appName: 'SpyMe',
  webDir: 'public',
  server: {
    url: 'https://spyme.com.ru',
    cleartext: true
  },
    plugins: {
    SplashScreen: {
      launchShowDuration: 0, // Отключаем автоскрытие по таймеру
      launchAutoHide: false, // Заставка будет висеть, пока мы не скроем ее вручную
      backgroundColor: "#050807",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;