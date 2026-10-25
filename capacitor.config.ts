import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.spyme.app',
  appName: 'SpyMe',
  webDir: 'public',
  server: {
    url: 'https://spyme.com.ru',
    cleartext: true
  }
};

export default config;