import {
  describe,
  beforeEach,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'bun:test';
import {
  Governance,
  REVIEW_PERIOD_MS,
  TestDriver,
  extractErrResponse,
  extractOkResponse,
  nnsProposerIdentity,
} from '../support';
import { AnonymousIdentity } from '@dfinity/agent';
import { generateRandomIdentity } from '@hadronous/pic';
import { ProposalResponse, type ListProposalsResponse } from '@cg/backend';

const MS_IN_MINUTE = 60 * 1000;

const PROPOSAL_SYNC_INTERVAL_MS = 5 * MS_IN_MINUTE; // 5 minutes

const advanceTimeToSyncProposals = async (driver: TestDriver) => {
  await driver.advanceTime(PROPOSAL_SYNC_INTERVAL_MS + 1);
};

/**
 * The state loaded into PIC already has this number of proposals in it.
 *
 * They are old, so they'll be marked as completed as soon as they're synced
 * by the backend canister cron job.
 */
const RVM_PROPOSALS_STATE_COUNT = 1;

const createRvmProposalsBatch = async (
  governance: Governance,
  neuronId: bigint,
  count: number,
): Promise<bigint[]> => {
  const rvmProposalIds = [];
  for (let i = 0; i < count; i++) {
    const rvmProposalId = await governance.createRvmProposal(
      nnsProposerIdentity,
      {
        neuronId,
        title: `Test Proposal Title ${i}`,
        summary: `Test Proposal Summary ${i}`,
        replicaVersion: 'd19fa446ab35780b2c6d8b82ea32d808cca558d5',
      },
    );
    rvmProposalIds.push(rvmProposalId);
  }
  return rvmProposalIds;
};

describe('Proposal', () => {
  let driver: TestDriver;
  let governance: Governance;
  const newRvmProposalsCount = 10;
  const totalRvmProposalsCount = 10 + RVM_PROPOSALS_STATE_COUNT;
  let rvmProposalIds: bigint[] = [];

  beforeAll(async () => {
    driver = await TestDriver.createWithNnsState();
    governance = new Governance(driver.pic);
    const neuronId = await governance.createNeuron(nnsProposerIdentity);
    rvmProposalIds = await createRvmProposalsBatch(
      governance,
      neuronId,
      newRvmProposalsCount,
    );
  });

  beforeEach(async () => {
    await driver.resetBackendCanister();
  });

  afterAll(async () => {
    await driver.tearDown();
  });

  const expectListProposalsResult = (
    res: ListProposalsResponse,
    expectedCount?: number,
  ) => {
    const { proposals } = extractOkResponse(res);
    expect(proposals.length).toEqual(expectedCount ?? totalRvmProposalsCount);
    for (const rvmProposalId of rvmProposalIds) {
      expect(
        proposals.findIndex(
          p => p.proposal.nervous_system.network.id === rvmProposalId,
        ),
      ).toBeGreaterThan(-1);
    }
  };

  describe('sync proposals', () => {
    it('should sync proposals on intervals', async () => {
      const resEmpty = await driver.actor.list_proposals({
        state: [],
      });
      const { proposals: proposalsEmpty } = extractOkResponse(resEmpty);
      expect(proposalsEmpty.length).toEqual(0);

      // fire the intervals
      await advanceTimeToSyncProposals(driver);

      const res = await driver.actor.list_proposals({
        state: [],
      });
      expectListProposalsResult(res);
    });

    it('should not allow non admins to sync proposals', async () => {
      const notAuthenticatedIdentity = new AnonymousIdentity();
      driver.actor.setIdentity(notAuthenticatedIdentity);
      const resUnauthenticated = await driver.actor.sync_proposals();
      const resUnauthenticatedErr = extractErrResponse(resUnauthenticated);
      expect(resUnauthenticatedErr).toEqual({
        code: 404,
        message: `Principal ${notAuthenticatedIdentity.getPrincipal().toText()} must have a profile to call this endpoint`,
      });

      const randomIdentity = generateRandomIdentity();
      driver.actor.setIdentity(randomIdentity);
      const resNoProfile = await driver.actor.sync_proposals();
      const resNoProfileErr = extractErrResponse(resNoProfile);
      expect(resNoProfileErr).toEqual({
        code: 404,
        message: `Principal ${randomIdentity.getPrincipal().toText()} must have a profile to call this endpoint`,
      });

      const [anonymousIdentity] = await driver.users.createAnonymous();
      driver.actor.setIdentity(anonymousIdentity);
      const resAnonymous = await driver.actor.sync_proposals();
      const resAnonymousErr = extractErrResponse(resAnonymous);
      expect(resAnonymousErr).toEqual({
        code: 403,
        message: `Principal ${anonymousIdentity.getPrincipal().toText()} must be an admin to call this endpoint`,
      });

      const [reviewerIdentity] = await driver.users.createReviewer();
      driver.actor.setIdentity(reviewerIdentity);
      const resReviewer = await driver.actor.sync_proposals();
      const resReviewerErr = extractErrResponse(resReviewer);
      expect(resReviewerErr).toEqual({
        code: 403,
        message: `Principal ${reviewerIdentity.getPrincipal().toText()} must be an admin to call this endpoint`,
      });
    });

    it('should allow admins to sync proposals', async () => {
      const [adminIdentity] = await driver.users.createAdmin();

      const resEmpty = await driver.actor.list_proposals({
        state: [],
      });
      const { proposals: proposalsEmpty } = extractOkResponse(resEmpty);
      expect(proposalsEmpty.length).toEqual(0);

      driver.actor.setIdentity(adminIdentity);
      const resSync = await driver.actor.sync_proposals();
      extractOkResponse(resSync);

      const res = await driver.actor.list_proposals({
        state: [],
      });
      expectListProposalsResult(res);
    });
  });

  describe('complete proposals', () => {
    it('should not complete proposals before review deadline', async () => {
      await advanceTimeToSyncProposals(driver);

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      expectListProposalsResult(resInProgress, newRvmProposalsCount);

      // advance time, but do not reach the review deadline
      await driver.advanceTime(REVIEW_PERIOD_MS - driver.advancedTimeMs - 1);

      const resCompleted = await driver.actor.list_proposals({
        state: [{ completed: null }],
      });
      const { proposals: proposalsCompleted } = extractOkResponse(resCompleted);
      expect(proposalsCompleted.length).toEqual(RVM_PROPOSALS_STATE_COUNT);

      const resInProgress2 = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      expectListProposalsResult(resInProgress2, newRvmProposalsCount);
    });

    it('should complete proposals after review deadline', async () => {
      const advancedTimeMs = driver.advancedTimeMs;

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgress } =
        extractOkResponse(resInProgress);
      expect(proposalsInProgress.length).toEqual(0);

      await advanceTimeToSyncProposals(driver);
      // make proposals complete
      await driver.advanceTime(
        REVIEW_PERIOD_MS - (driver.advancedTimeMs - advancedTimeMs),
      );

      const resCompleted = await driver.actor.list_proposals({
        state: [{ completed: null }],
      });
      expectListProposalsResult(resCompleted);

      const resInProgressAfterComplete = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgressAfterComplete } = extractOkResponse(
        resInProgressAfterComplete,
      );
      expect(proposalsInProgressAfterComplete.length).toEqual(0);
    });
  });

  describe('list proposals', () => {
    const expectProposalsSortedByTimestampDesc = (
      proposals: ProposalResponse[],
    ) => {
      const lastFetchedProposalsTimestamps = proposals.map(p =>
        new Date(p.proposal.proposed_at).getTime(),
      );
      for (let i = 1; i < lastFetchedProposalsTimestamps.length; i++) {
        expect(lastFetchedProposalsTimestamps[i - 1]).toBeGreaterThan(
          lastFetchedProposalsTimestamps[i],
        );
      }
    };

    const createProposalsEveryHour = async (
      proposalsCount: number,
    ): Promise<bigint[]> => {
      const neuronId = await governance.createNeuron(nnsProposerIdentity);
      const ids: bigint[] = [];
      for (let i = 0; i < proposalsCount; i++) {
        await driver.advanceTime(60 * MS_IN_MINUTE); // 1 hour

        const proposalId = await governance.createRvmProposal(
          nnsProposerIdentity,
          {
            neuronId,
            title: `Test Proposal Title Last ${i}`,
            summary: `Test Proposal Summary Last ${i}`,
            replicaVersion: 'd19fa446ab35780b2c6d8b82ea32d808cca558d5',
          },
        );
        ids.push(proposalId);
      }

      return ids;
    };

    it('should allow anyone to list proposals', async () => {
      await advanceTimeToSyncProposals(driver);

      // it.each doesn't seem to work here, using a for loop instead
      const identities = [
        new AnonymousIdentity(),
        generateRandomIdentity(),
        (await driver.users.createAnonymous())[0],
        (await driver.users.createReviewer())[0],
        (await driver.users.createAdmin())[0],
      ];

      for (const identity of identities) {
        driver.actor.setIdentity(identity);
        const res = await driver.actor.list_proposals({ state: [] });
        expectListProposalsResult(res);
      }
    });

    it('should list proposals in reverse chronological order', async () => {
      await advanceTimeToSyncProposals(driver);

      // only these proposals will be in progress
      const lastRvmProposalIds = await createProposalsEveryHour(2);
      lastRvmProposalIds.reverse();

      await advanceTimeToSyncProposals(driver);

      const res = await driver.actor.list_proposals({ state: [] });
      expectListProposalsResult(
        res,
        totalRvmProposalsCount + lastRvmProposalIds.length,
      );
      const { proposals } = extractOkResponse(res);
      expectProposalsSortedByTimestampDesc(
        proposals.filter(p =>
          lastRvmProposalIds.includes(p.proposal.nervous_system.network.id),
        ),
      );
    });

    it('should list proposals by state in reverse chronological order', async () => {
      await advanceTimeToSyncProposals(driver);

      // only these proposals will be in progress
      const lastRvmProposalIds = await createProposalsEveryHour(2);
      lastRvmProposalIds.reverse();

      await advanceTimeToSyncProposals(driver);

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgress } =
        extractOkResponse(resInProgress);
      expectProposalsSortedByTimestampDesc(
        proposalsInProgress.filter(p =>
          lastRvmProposalIds.includes(p.proposal.nervous_system.network.id),
        ),
      );

      // make proposals complete
      await driver.advanceTime(REVIEW_PERIOD_MS);

      const resCompleted = await driver.actor.list_proposals({
        state: [{ completed: null }],
      });
      const { proposals: proposalsCompleted } = extractOkResponse(resCompleted);
      expectProposalsSortedByTimestampDesc(
        proposalsCompleted.filter(p =>
          lastRvmProposalIds.includes(p.proposal.nervous_system.network.id),
        ),
      );
    });
  });
});
