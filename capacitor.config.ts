import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dash3.yonkou',
  appName: 'Dash3Mobile',
  webDir: 'dist',
  plugins: {
    // Mises à jour gérées par src/services/liveUpdate.ts (bundles publiés en release GitHub)
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;
