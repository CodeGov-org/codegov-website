import { type CanisterFixture, type PocketIc } from '@hadronous/pic';
import { type _SERVICE, idlFactory } from '@cg/backend';
import { resolve } from 'node:path';
import { controllerIdentity } from './identity';
import { Principal } from '@dfinity/principal';

export const BACKEND_WASM_PATH = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '.dfx',
  'local',
  'canisters',
  'backend',
  'backend.wasm.gz',
);

export async function setupBackendCanister(
  pic: PocketIc,
): Promise<CanisterFixture<_SERVICE>> {
  const fixture = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM_PATH,
    sender: controllerIdentity.getPrincipal(),
  });

  // make sure init timers run
  await pic.tick(2);

  return fixture;
}

export async function resetBackendCanister(
  pic: PocketIc,
  canisterId: Principal,
): Promise<void> {
  await pic.reinstallCode({
    canisterId,
    wasm: BACKEND_WASM_PATH,
    sender: controllerIdentity.getPrincipal(),
  });

  // make sure init timers run
  await pic.tick(2);
}
