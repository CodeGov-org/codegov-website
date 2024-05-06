declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PIC_URL: string;
    }
  }
}

export {};
