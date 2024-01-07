import { beforeAll, describe, expect, it } from 'bun:test';
import { type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor } from '@hadronous/pic';
import { anonymousIdentity, setupBackendCanister } from '../support';

describe('User Profile', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;

  beforeAll(async () => {
    pic = await PocketIc.create();
    const fixture = await setupBackendCanister(pic);
    actor = fixture.actor;
  });

  it('should say hello', async () => {
    actor.setIdentity(anonymousIdentity);

    const result = await actor.say_hello();

    expect(result).toBe('Hello, world!');
  });
});
