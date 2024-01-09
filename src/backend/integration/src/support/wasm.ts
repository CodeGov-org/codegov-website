import { type CanisterFixture, type PocketIc } from '@hadronous/pic';
import { type _SERVICE, idlFactory } from '@cg/backend';
import { resolve } from 'node:path';
import { controllerIdentity } from './identity';

export const BACKEND_WASM_PATH = resolve(
  import.meta.dir,
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
): Promise<CanisterFixture<_SERVICE>> {
  const fixture = await pic.setupCanister<_SERVICE>(
    idlFactory,
    BACKEND_WASM_PATH,
    {},
    new Uint8Array(),
    controllerIdentity.getPrincipal(),
  );

  // make sure init timers run
  await pic.resetTime();
  await pic.tick();
  await pic.tick();
  await pic.tick();

  return fixture;
}
