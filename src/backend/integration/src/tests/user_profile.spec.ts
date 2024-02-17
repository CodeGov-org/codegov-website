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

function usernameRegex(prefix: string): RegExp {
  return new RegExp(`^${prefix}_[a-zA-Z0-9]{8}$`);
}

const adminUsernameRegex = usernameRegex('Admin');
const anonymousUsernameRegex = usernameRegex('Anonymous');

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
      username: expect.stringMatching(adminUsernameRegex),
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
    expect(aliceCreate.username).toMatch(anonymousUsernameRegex);
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
    expect(bobCreate.username).toMatch(anonymousUsernameRegex);
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

  describe('update my user profile', () => {
    it('should not allow anonymous principals', async () => {
      actor.setIdentity(anonymousIdentity);

      const res = await actor.update_my_user_profile({
        username: ['Alice'],
        config: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 401,
        message: 'Anonymous principals are not allowed to call this endpoint',
      });
    });

    it('should not allow unregistered principals', async () => {
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      const res = await actor.update_my_user_profile({
        username: ['Alice'],
        config: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `User id for principal ${alice
          .getPrincipal()
          .toText()} not found`,
      });
    });

    it('should not allow anonymous users to change their role', async () => {
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      await actor.create_my_user_profile();

      const res = await actor.update_my_user_profile({
        username: ['Alice'],
        config: [{ admin: { bio: ['Alice is a good admin...'] } }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: 'Users are not allowed to change their own role',
      });
    });

    it('should not allow reviewers to change their role', async () => {
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      await actor.create_my_user_profile();

      const res = await actor.update_my_user_profile({
        username: ['Alice'],
        config: [{ admin: { bio: ['Alice is a good admin...'] } }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: 'Users are not allowed to change their own role',
      });
    });

    it('should now allow choosing a username that already exists', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();

      actor.setIdentity(alice);
      await actor.create_my_user_profile();
      await actor.update_my_user_profile({
        username: ['Alice'],
        config: [],
      });

      actor.setIdentity(bob);
      await actor.create_my_user_profile();
      const bobCreateRes = await actor.update_my_user_profile({
        username: ['Alice'],
        config: [],
      });
      const bobCreateErr = extractErrResponse(bobCreateRes);

      expect(bobCreateErr).toEqual({
        code: 409,
        message: 'Username Alice already exists',
      });
    });

    it('should allow users to update their own profiles', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();

      actor.setIdentity(alice);
      const aliceCreateRes = await actor.create_my_user_profile();
      const aliceCreate = extractOkResponse(aliceCreateRes);

      actor.setIdentity(bob);
      const bobCreateRes = await actor.create_my_user_profile();
      const bobCreate = extractOkResponse(bobCreateRes);

      const aliceUpdateDate = new Date(1988, 1, 15, 0, 0, 0, 0);
      await pic.setTime(aliceUpdateDate.getTime());

      actor.setIdentity(controllerIdentity);
      const aliceUpdateUsername = 'Alice';
      const aliceUpdateBio = 'Alice is a good admin...';
      await actor.update_user_profile({
        user_id: aliceCreate.id,
        username: [aliceUpdateUsername],
        config: [{ admin: { bio: [aliceUpdateBio] } }],
      });

      const bobUpdateDate = new Date(1988, 1, 16, 0, 0, 0, 0);
      await pic.setTime(bobUpdateDate.getTime());

      actor.setIdentity(controllerIdentity);
      const bobUpdateUsername = 'Bob';
      const bobUpdateBio = 'Bob is a good reviewer...';
      const bobUpdateNeuronId = 7862326246190316138n;
      const bobUpdateWalletAddress =
        'da01eead5eb00bb853b9c42e1637433c81348a8856f4cff1bb917e2cd04df2cb';
      await actor.update_user_profile({
        user_id: bobCreate.id,
        username: [bobUpdateUsername],
        config: [
          {
            reviewer: {
              bio: [bobUpdateBio],
              neuron_id: [bobUpdateNeuronId],
              wallet_address: [bobUpdateWalletAddress],
            },
          },
        ],
      });

      const aliceFinalUpdateDate = new Date(1988, 1, 17, 0, 0, 0, 0);
      await pic.setTime(aliceFinalUpdateDate.getTime());

      actor.setIdentity(alice);
      const aliceFinalUpdateUsername = 'InfiniteAlice';
      const aliceFinalUpdateBio = 'Alice is an infinitely good admin...';
      await actor.update_my_user_profile({
        username: [aliceFinalUpdateUsername],
        config: [{ admin: { bio: [aliceFinalUpdateBio] } }],
      });

      const bobFinalUpdateDate = new Date(1988, 1, 18, 0, 0, 0, 0);
      await pic.setTime(bobFinalUpdateDate.getTime());

      actor.setIdentity(bob);
      const bobFinalUpdateUsername = 'InfiniteBob';
      const bobFinalUpdateBio = 'Bob is an infinitely good reviewer...';
      const bobFinalUpdateWalletAddress =
        '4dfa940def17f1427ae47378c440f10185867677109a02bc8374fc25b9dee8af';
      await actor.update_my_user_profile({
        username: [bobFinalUpdateUsername],
        config: [
          {
            reviewer: {
              bio: [bobFinalUpdateBio],
              wallet_address: [bobFinalUpdateWalletAddress],
            },
          },
        ],
      });

      const adminFinalUpdateDate = new Date(1988, 1, 19, 0, 0, 0, 0);
      await pic.setTime(adminFinalUpdateDate.getTime());

      actor.setIdentity(controllerIdentity);
      const adminFinalUpdateUsername = 'InfiniteAdmin';
      const adminFinalUpdateBio = 'Admin is an infinitely good admin...';
      await actor.update_my_user_profile({
        username: [adminFinalUpdateUsername],
        config: [{ admin: { bio: [adminFinalUpdateBio] } }],
      });

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

      actor.setIdentity(controllerIdentity);
      const adminGetRes = await actor.get_my_user_profile();
      const adminGet = extractOkResponse(adminGetRes);
      const adminGetHistoryRes = await actor.get_my_user_profile_history();
      const adminGetHistory = extractOkResponse(adminGetHistoryRes);

      expect(aliceGet).toEqual({
        id: aliceCreate.id,
        username: aliceFinalUpdateUsername,
        config: { admin: { bio: aliceFinalUpdateBio } },
      });
      expect(aliceGetHistory.history).toHaveLength(3);
      expect(aliceGetHistory.history).toEqual([
        {
          action: { create: null },
          user: alice.getPrincipal(),
          date_time: dateToRfc3339(currentDate),
          data: {
            username: aliceCreate.username,
            config: aliceCreate.config,
          },
        },
        {
          action: { update: null },
          user: controllerIdentity.getPrincipal(),
          date_time: dateToRfc3339(aliceUpdateDate),
          data: {
            username: aliceUpdateUsername,
            config: { admin: { bio: aliceUpdateBio } },
          },
        },
        {
          action: { update: null },
          user: alice.getPrincipal(),
          date_time: dateToRfc3339(aliceFinalUpdateDate),
          data: {
            username: aliceFinalUpdateUsername,
            config: { admin: { bio: aliceFinalUpdateBio } },
          },
        },
      ]);

      expect(bobGet).toEqual({
        id: bobCreate.id,
        username: bobFinalUpdateUsername,
        config: {
          reviewer: {
            bio: bobFinalUpdateBio,
            neuron_id: bobUpdateNeuronId,
            wallet_address: bobFinalUpdateWalletAddress,
          },
        },
      });
      expect(bobGetHistory.history).toHaveLength(3);
      expect(bobGetHistory.history).toEqual([
        {
          action: { create: null },
          user: bob.getPrincipal(),
          date_time: dateToRfc3339(currentDate),
          data: {
            username: bobCreate.username,
            config: bobCreate.config,
          },
        },
        {
          action: { update: null },
          user: controllerIdentity.getPrincipal(),
          date_time: dateToRfc3339(bobUpdateDate),
          data: {
            username: bobUpdateUsername,
            config: {
              reviewer: {
                bio: bobUpdateBio,
                neuron_id: bobUpdateNeuronId,
                wallet_address: bobUpdateWalletAddress,
              },
            },
          },
        },
        {
          action: { update: null },
          user: bob.getPrincipal(),
          date_time: dateToRfc3339(bobFinalUpdateDate),
          data: {
            username: bobFinalUpdateUsername,
            config: {
              reviewer: {
                bio: bobFinalUpdateBio,
                neuron_id: bobUpdateNeuronId,
                wallet_address: bobFinalUpdateWalletAddress,
              },
            },
          },
        },
      ]);

      expect(adminGet).toEqual({
        id: expect.any(String),
        username: adminFinalUpdateUsername,
        config: { admin: { bio: adminFinalUpdateBio } },
      });
      expect(adminGetHistory.history).toHaveLength(2);
      expect(adminGetHistory.history).toEqual([
        {
          action: { create: null },
          user: controllerIdentity.getPrincipal(),
          date_time: dateToRfc3339(currentDate),
          data: {
            username: expect.stringMatching(adminUsernameRegex),
            config: {
              admin: {
                bio: 'Default admin profile created for canister controllers',
              },
            },
          },
        },
        {
          action: { update: null },
          user: controllerIdentity.getPrincipal(),
          date_time: dateToRfc3339(adminFinalUpdateDate),
          data: {
            username: adminFinalUpdateUsername,
            config: { admin: { bio: adminFinalUpdateBio } },
          },
        },
      ]);
    });
  });

  describe('update user profile', () => {
    const unknown_user_id = 'acb10f05-8b6c-42ab-b760-c7da49353305';

    it('should not allow anonymous principals', async () => {
      actor.setIdentity(anonymousIdentity);

      const res = await actor.update_user_profile({
        user_id: unknown_user_id,
        username: ['Alice'],
        config: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 401,
        message: 'Anonymous principals are not allowed to call this endpoint',
      });
    });

    it('should not allow unregistered principals', async () => {
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      const res = await actor.update_user_profile({
        user_id: unknown_user_id,
        username: ['Alice'],
        config: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must have a profile to call this endpoint`,
      });
    });

    it('should not allow non-admin principals', async () => {
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      await actor.create_my_user_profile();

      const res = await actor.update_user_profile({
        user_id: unknown_user_id,
        username: ['Alice'],
        config: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must be an admin to call this endpoint`,
      });
    });

    it('should not allow updating a profile that does not exist', async () => {
      actor.setIdentity(controllerIdentity);

      const res = await actor.update_user_profile({
        user_id: unknown_user_id,
        username: ['Alice'],
        config: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `User profile for user with id ${unknown_user_id} not found`,
      });
    });

    it('should now allow choosing a username that already exists', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();

      actor.setIdentity(alice);
      await actor.create_my_user_profile();
      await actor.update_my_user_profile({
        username: ['Alice'],
        config: [],
      });

      actor.setIdentity(bob);
      const bobCreateRes = await actor.create_my_user_profile();
      const bobCreate = extractOkResponse(bobCreateRes);
      await actor.update_my_user_profile({
        username: ['Bob'],
        config: [],
      });

      actor.setIdentity(controllerIdentity);
      const bobUpdateRes = await actor.update_user_profile({
        user_id: bobCreate.id,
        username: ['Alice'],
        config: [],
      });
      const bobUpdateErr = extractErrResponse(bobUpdateRes);

      expect(bobUpdateErr).toEqual({
        code: 409,
        message: 'Username Alice already exists',
      });
    });

    it('should allow admins to promote other users', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();

      actor.setIdentity(alice);
      const aliceCreateRes = await actor.create_my_user_profile();
      const aliceCreate = extractOkResponse(aliceCreateRes);

      actor.setIdentity(bob);
      const bobCreateRes = await actor.create_my_user_profile();
      const bobCreate = extractOkResponse(bobCreateRes);

      const aliceUpdateDate = new Date(1988, 1, 15, 0, 0, 0, 0);
      await pic.setTime(aliceUpdateDate.getTime());

      actor.setIdentity(controllerIdentity);
      const aliceUpdateUsername = 'Alice';
      const aliceUpdateBio = 'Alice is a good admin...';
      await actor.update_user_profile({
        user_id: aliceCreate.id,
        username: [aliceUpdateUsername],
        config: [{ admin: { bio: [aliceUpdateBio] } }],
      });

      const bobUpdateDate = new Date(1988, 1, 16, 0, 0, 0, 0);
      await pic.setTime(bobUpdateDate.getTime());

      actor.setIdentity(alice);
      const bobUpdateUsername = 'Bob';
      const bobUpdateBio = 'Bob is a good reviewer...';
      const bobUpdateNeuronId = 7862326246190316138n;
      const bobUpdateWalletAddress =
        'da01eead5eb00bb853b9c42e1637433c81348a8856f4cff1bb917e2cd04df2cb';
      await actor.update_user_profile({
        user_id: bobCreate.id,
        username: [bobUpdateUsername],
        config: [
          {
            reviewer: {
              bio: [bobUpdateBio],
              neuron_id: [bobUpdateNeuronId],
              wallet_address: [bobUpdateWalletAddress],
            },
          },
        ],
      });

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

      expect(aliceGet).toEqual({
        id: aliceCreate.id,
        username: aliceUpdateUsername,
        config: { admin: { bio: aliceUpdateBio } },
      });
      expect(aliceGetHistory.history).toHaveLength(2);
      expect(aliceGetHistory.history[0]).toEqual({
        action: { create: null },
        user: alice.getPrincipal(),
        date_time: dateToRfc3339(currentDate),
        data: {
          username: aliceCreate.username,
          config: aliceCreate.config,
        },
      });
      expect(aliceGetHistory.history[1]).toEqual({
        action: { update: null },
        user: controllerIdentity.getPrincipal(),
        date_time: dateToRfc3339(aliceUpdateDate),
        data: {
          username: aliceUpdateUsername,
          config: { admin: { bio: aliceUpdateBio } },
        },
      });

      expect(bobGet).toEqual({
        id: bobCreate.id,
        username: bobUpdateUsername,
        config: {
          reviewer: {
            bio: bobUpdateBio,
            neuron_id: bobUpdateNeuronId,
            wallet_address: bobUpdateWalletAddress,
          },
        },
      });
      expect(bobGetHistory.history).toHaveLength(2);
      expect(bobGetHistory.history[0]).toEqual({
        action: { create: null },
        user: bob.getPrincipal(),
        date_time: dateToRfc3339(currentDate),
        data: {
          username: bobCreate.username,
          config: bobCreate.config,
        },
      });
      expect(bobGetHistory.history[1]).toEqual({
        action: { update: null },
        user: alice.getPrincipal(),
        date_time: dateToRfc3339(bobUpdateDate),
        data: {
          username: bobUpdateUsername,
          config: {
            reviewer: {
              bio: bobUpdateBio,
              neuron_id: bobUpdateNeuronId,
              wallet_address: bobUpdateWalletAddress,
            },
          },
        },
      });
    });
  });
});
