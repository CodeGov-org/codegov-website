import { PocketIcServer } from '@hadronous/pic';

declare global {
  // eslint-disable-next-line no-var
  declare var __PIC__: PocketIcServer;

  namespace NodeJS {
    interface ProcessEnv {
      PIC_URL: string;
    }
  }
}
