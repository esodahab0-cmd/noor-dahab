interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    url?: string;
    cleartext?: boolean;
  };
  plugins?: Record<string, any>;
  android?: Record<string, any>;
  ios?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: "online.dahabsoftware.noordahab",
  appName: "نور دهب",
  webDir: "out",
  server: {
    androidScheme: "https",
    url: "https://dahabsoftware.online",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSplashResourceName: "splash",
    },
    StatusBar: {
      backgroundColor: "#000000",
      style: "DARK",
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
