import { beforeAll, afterAll } from 'bun:test';
import { PocketIcServer } from '@hadronous/pic';

let pic: PocketIcServer | undefined;

beforeAll(async () => {
  pic = await PocketIcServer.start();
  const url = pic.getUrl();

  process.env.PIC_URL = url;
});

afterAll(async () => {
  await pic?.stop();
});
