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

const PROPOSAL_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const advanceTimeToSyncProposals = async (driver: TestDriver) => {
  await driver.advanceTime(PROPOSAL_SYNC_INTERVAL_MS + 1);
};

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
  const rvmProposalsCount = 10;
  let rvmProposalIds: bigint[] = [];

  beforeAll(async () => {
    driver = await TestDriver.createWithNnsState();
    governance = new Governance(driver.pic);
    const neuronId = await governance.createNeuron(nnsProposerIdentity);
    rvmProposalIds = await createRvmProposalsBatch(
      governance,
      neuronId,
      rvmProposalsCount,
    );
  });

  beforeEach(async () => {
    await driver.resetBackendCanister();
  });

  afterAll(async () => {
    await driver.tearDown();
  });

  describe('sync proposals', () => {
    it('should sync proposals on intervals', async () => {
      const resEmpty = await driver.actor.list_proposals({
        state: [],
      });
      const { proposals: proposalsEmpty } = extractOkResponse(resEmpty);
      expect(proposalsEmpty.length).toBe(0);

      // fire the intervals
      await advanceTimeToSyncProposals(driver);

      const res = await driver.actor.list_proposals({
        state: [],
      });
      const { proposals } = extractOkResponse(res);
      expect(proposals.length).toBe(rvmProposalsCount);
      for (const rvmProposalId of rvmProposalIds) {
        expect(
          proposals.findIndex(
            p => p.proposal.nervous_system.network.id === rvmProposalId,
          ),
        ).toBeGreaterThan(-1);
      }
    });

    it('should not allow non admin users to sync proposals', async () => {
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
      expect(proposalsEmpty.length).toBe(0);

      driver.actor.setIdentity(adminIdentity);
      const resSync = await driver.actor.sync_proposals();
      extractOkResponse(resSync);

      const res = await driver.actor.list_proposals({
        state: [],
      });
      const { proposals } = extractOkResponse(res);
      expect(proposals.length).toBe(rvmProposalsCount);
      for (const rvmProposalId of rvmProposalIds) {
        expect(
          proposals.findIndex(
            p => p.proposal.nervous_system.network.id === rvmProposalId,
          ),
        ).toBeGreaterThan(-1);
      }
    });
  });

  describe('complete proposals', () => {
    it('should not complete proposals before review deadline', async () => {
      await advanceTimeToSyncProposals(driver);

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgress } =
        extractOkResponse(resInProgress);
      expect(proposalsInProgress.length).toBe(rvmProposalsCount);

      // advance time, but do not reach the review deadline
      await driver.advanceTime(REVIEW_PERIOD_MS - driver.advancedTimeMs - 1);

      const resCompleted = await driver.actor.list_proposals({
        state: [{ completed: null }],
      });
      const { proposals: proposalsCompleted } = extractOkResponse(resCompleted);
      expect(proposalsCompleted.length).toBe(0);

      const resInProgress2 = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgress2 } =
        extractOkResponse(resInProgress2);
      expect(proposalsInProgress2.length).toBe(rvmProposalsCount);
    });

    it('should complete proposals after review deadline', async () => {
      const advancedTimeMs = driver.advancedTimeMs;

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgress } =
        extractOkResponse(resInProgress);
      expect(proposalsInProgress.length).toBe(0);

      await advanceTimeToSyncProposals(driver);
      // make proposals complete
      await driver.advanceTime(
        REVIEW_PERIOD_MS - (driver.advancedTimeMs - advancedTimeMs),
      );

      const resCompleted = await driver.actor.list_proposals({
        state: [{ completed: null }],
      });
      const { proposals: proposalsCompleted } = extractOkResponse(resCompleted);
      expect(proposalsCompleted.length).toBe(rvmProposalsCount);
      for (const rvmProposalId of rvmProposalIds) {
        expect(
          proposalsCompleted.findIndex(
            p => p.proposal.nervous_system.network.id === rvmProposalId,
          ),
        ).toBeGreaterThan(-1);
      }

      const resInProgressAfterComplete = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      const { proposals: proposalsInProgressAfterComplete } = extractOkResponse(
        resInProgressAfterComplete,
      );
      expect(proposalsInProgressAfterComplete.length).toBe(0);
    });
  });
});
