import { beforeEach, describe, expect, it } from 'bun:test';
import { type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
import {
  anonymousIdentity,
  controllerIdentity,
  dateToRfc3339,
  extractErrResponse,
  extractOkResponse,
  setupBackendCanister,
} from '../support';

describe('User Profile', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
  const currentDate = new Date(1988, 1, 14, 0, 0, 0, 0);

  beforeEach(async () => {
    pic = await PocketIc.create();
    const fixture = await setupBackendCanister(pic, currentDate);
    actor = fixture.actor;
  });

  it('should not allow the anonymous principal', async () => {
    actor.setIdentity(anonymousIdentity);

    const res = await actor.get_my_user_profile();
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 401,
      message: 'Anonymous principals are not allowed to call this endpoint',
    });
  });

  it('should auto create an admin profile for the controller', async () => {
    actor.setIdentity(controllerIdentity);

    const res = await actor.get_my_user_profile();
    const resOk = extractOkResponse(res);

    const historyRes = await actor.get_my_user_profile_history();
    const historyOk = extractOkResponse(historyRes);

    expect(resOk).toEqual({
      id: expect.any(String),
      username: 'Admin',
      config: {
        admin: {
          bio: 'Default admin profile created for canister controllers',
        },
      },
    });
    expect(historyOk.history).toHaveLength(1);
    expect(historyOk.history[0]).toEqual({
      action: { create: null },
      user: controllerIdentity.getPrincipal(),
      date_time: dateToRfc3339(currentDate),
      data: {
        username: resOk.username,
        config: resOk.config,
      },
    });
  });

  it('should not return a profile that does not exist', async () => {
    const alice = generateRandomIdentity();
    actor.setIdentity(alice);

    const res = await actor.get_my_user_profile();
    const resErr = extractErrResponse(res);

    const principal = alice.getPrincipal().toText();
    expect(resErr).toEqual({
      code: 404,
      message: `User profile with principal ${principal} not found`,
    });
  });

  it('should create and return a new anonymous profile', async () => {
    const alice = generateRandomIdentity();
    const bob = generateRandomIdentity();

    actor.setIdentity(alice);
    const aliceCreateRes = await actor.create_my_user_profile();
    const aliceCreate = extractOkResponse(aliceCreateRes);

    actor.setIdentity(bob);
    const bobCreateRes = await actor.create_my_user_profile();
    const bobCreate = extractOkResponse(bobCreateRes);

    actor.setIdentity(alice);
    const aliceGetRes = await actor.get_my_user_profile();
    const aliceGet = extractOkResponse(aliceGetRes);
    const aliceGetHistoryRes = await actor.get_my_user_profile_history();
    const aliceGetHistory = extractOkResponse(aliceGetHistoryRes);

    actor.setIdentity(bob);
    const bobGetRes = await actor.get_my_user_profile();
    const bobGet = extractOkResponse(bobGetRes);
    const bobGetHistoryRes = await actor.get_my_user_profile_history();
    const bobGetHistory = extractOkResponse(bobGetHistoryRes);

    expect(aliceCreate.id).toBeString();
    expect(aliceCreate.username).toBe('Anonymous');
    expect(aliceCreate.config).toEqual({ anonymous: null });
    expect(aliceGetHistory.history).toHaveLength(1);
    expect(aliceGetHistory.history[0]).toEqual({
      action: { create: null },
      user: alice.getPrincipal(),
      date_time: dateToRfc3339(currentDate),
      data: {
        username: aliceCreate.username,
        config: aliceCreate.config,
      },
    });

    expect(bobCreate.id).toBeString();
    expect(bobCreate.username).toBe('Anonymous');
    expect(bobCreate.config).toEqual({ anonymous: null });
    expect(bobGetHistory.history).toHaveLength(1);
    expect(bobGetHistory.history[0]).toEqual({
      action: { create: null },
      user: bob.getPrincipal(),
      date_time: dateToRfc3339(currentDate),
      data: {
        username: bobCreate.username,
        config: bobCreate.config,
      },
    });

    expect(aliceCreate.id).not.toEqual(bobCreate.id);

    expect(aliceGet).toEqual(aliceCreate);
    expect(bobGet).toEqual(bobCreate);
  });
});
