import { type CanisterFixture, type PocketIc } from '@hadronous/pic';
import { type _SERVICE, idlFactory } from '@cg/backend';
import { resolve } from 'node:path';
import { controllerIdentity } from './identity';

export const BACKEND_WASM_PATH = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'target',
  'wasm32-unknown-unknown',
  'release',
  'backend_impl.wasm',
);

export async function setupBackendCanister(
  pic: PocketIc,
  initialDate: Date = new Date(),
): Promise<CanisterFixture<_SERVICE>> {
  await pic.setTime(initialDate.getTime());

  const fixture = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM_PATH,
    sender: controllerIdentity.getPrincipal(),
  });

  // make sure init timers run
  await pic.tick(2);

  return fixture;
}
