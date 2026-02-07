import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reflexia.app',
  appName: 'Reflexia',
  webDir: 'dist',
  android: {
    // Allow cleartext traffic for local development
    allowMixedContent: true,
  },
  server: {
    // Enable orientation changes
    androidScheme: 'https',
  },
  plugins: {
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a', // Match app's dark theme
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
