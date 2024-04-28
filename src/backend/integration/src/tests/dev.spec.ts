import { Principal } from '@dfinity/principal';
import { PocketIc } from '@hadronous/pic';
import { BACKEND_WASM_PATH, controllerIdentity } from '../support';
import { IDL } from '@dfinity/candid';

describe('Dev features', () => {
  let canisterId: Principal;
  let pic: PocketIc;

  const controller = controllerIdentity.getPrincipal();

  beforeEach(async () => {
    pic = await PocketIc.create(process.env.PIC_URL, {
      processingTimeoutMs: 10_000,
    });

    canisterId = await pic.createCanister({
      sender: controller,
    });
    await pic.installCode({
      canisterId,
      wasm: BACKEND_WASM_PATH,
      sender: controller,
    });
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  it('should not allow closing proposals', async () => {
    await expect(
      async () =>
        await pic.updateCall({
          canisterId,
          method: 'close_proposal',
          arg: IDL.encode([IDL.Text], ['e716b277-cea0-40ba-b458-2e4585bc2a2f']),
        }),
    ).rejects.toThrow(
      `Canister ${canisterId.toText()} has no update method 'close_proposal'`,
    );
  });
});
