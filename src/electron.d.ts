// Type declarations for Electron IPC bridge
export {};

declare global {
  interface Window {
    electronStore?: {
      get: (key: string) => Promise<any[]>;
      set: (key: string, data: any[]) => Promise<boolean>;
      getDataPath: () => Promise<string>;
    };
  }
}
