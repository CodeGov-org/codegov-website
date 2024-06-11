import { describe, beforeAll, afterAll, it, expect } from 'bun:test';
import { TestDriver } from '../support';
import { IDL } from '@dfinity/candid';

describe('Dev features', () => {
  let driver: TestDriver;

  beforeAll(async () => {
    driver = await TestDriver.create();
  });

  afterAll(async () => {
    await driver.tearDown();
  });

  it('should not allow closing proposals', () => {
    expect(
      async () =>
        await driver.pic.updateCall({
          canisterId: driver.canisterId,
          method: 'close_proposal',
          arg: IDL.encode([IDL.Text], ['e716b277-cea0-40ba-b458-2e4585bc2a2f']),
        }),
    ).toThrow(
      `Error from Canister ${driver.canisterId.toText()}: Canister has no update method 'close_proposal'`,
    );
  });
});
