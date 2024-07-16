import { describe, beforeEach, afterEach, it, expect } from 'bun:test';
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
const FETCH_PROPOSALS_LIMIT = 50; // same as on the canister

describe('Proposal', () => {
  let driver: TestDriver;
  let governance: Governance;
  const rvmProposalsCount = 10;
  let rvmProposalIds: bigint[] = [];

  const advanceTimeToSyncProposals = async (): Promise<number> => {
    const advanceMillis = PROPOSAL_SYNC_INTERVAL_MS + 1;
    await driver.advanceTime(advanceMillis);
    // extra ticks to make sure all timer are completed
    await driver.pic.tick(2);
    return advanceMillis;
  };

  const advanceTimeToCompleteProposals = async () => {
    await driver.advanceTime(REVIEW_PERIOD_MS + 1);
  };

  const createRvmProposalsBatch = async (count: number): Promise<bigint[]> => {
    const ids = [];
    for (let i = 0; i < count; i++) {
      // Create a neuron for each proposal to avoid incurring in neuron's lack of funds.
      // Not an optimal solution, but increasing the staked ICPs doesn't seem to work
      const neuronId = await governance.createNeuron(nnsProposerIdentity);
      const rvmProposalId = await governance.createRvmProposal(
        nnsProposerIdentity,
        {
          neuronId,
          title: `Test Proposal Title ${i}`,
          summary: `Test Proposal Summary ${i}`,
          replicaVersion: 'd19fa446ab35780b2c6d8b82ea32d808cca558d5',
        },
      );
      ids.push(rvmProposalId);
    }
    return ids;
  };

  const expectListProposalsResult = (
    res: ListProposalsResponse,
    expectedCount?: number,
  ) => {
    const { proposals } = extractOkResponse(res);
    expect(proposals.length).toEqual(expectedCount ?? rvmProposalsCount);
    for (const rvmProposalId of rvmProposalIds) {
      expect(
        proposals.findIndex(
          p => p.proposal.nervous_system.network.id === rvmProposalId,
        ),
      ).toBeGreaterThan(-1);
    }
  };

  beforeEach(async () => {
    driver = await TestDriver.createWithNnsState();
    governance = new Governance(driver.pic);
    rvmProposalIds = await createRvmProposalsBatch(rvmProposalsCount);
  });

  afterEach(async () => {
    await driver.tearDown();
  });

  describe('sync proposals', () => {
    it('should sync proposals on intervals', async () => {
      const resEmpty = await driver.actor.list_proposals({
        state: [],
      });
      const { proposals: proposalsEmpty } = extractOkResponse(resEmpty);
      expect(proposalsEmpty.length).toEqual(0);

      // fire the intervals
      await advanceTimeToSyncProposals();

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
      const { synced_proposals_count, completed_proposals_count } =
        extractOkResponse(resSync);

      const res = await driver.actor.list_proposals({
        state: [],
      });
      expectListProposalsResult(res, Number(synced_proposals_count));
      expect(Number(completed_proposals_count)).toEqual(0);
    });

    it('should sync proposals recursively', async () => {
      // create more proposals than FETCH_PROPOSALS_LIMIT
      const totalProposals = FETCH_PROPOSALS_LIMIT + 5;
      const createdIds = await createRvmProposalsBatch(
        totalProposals - rvmProposalsCount,
      );
      rvmProposalIds = rvmProposalIds.concat(createdIds);

      await advanceTimeToSyncProposals();

      const res = await driver.actor.list_proposals({ state: [] });
      expectListProposalsResult(res, totalProposals);
    });
  });

  describe('complete proposals', () => {
    it('should not complete proposals before review deadline', async () => {
      const advancedTimeMs = await advanceTimeToSyncProposals();

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      expectListProposalsResult(resInProgress);

      // advance time, but do not reach the review deadline
      await driver.advanceTime(REVIEW_PERIOD_MS - advancedTimeMs - 1);

      const resCompleted = await driver.actor.list_proposals({
        state: [{ completed: null }],
      });
      const { proposals: proposalsCompleted } = extractOkResponse(resCompleted);
      expect(proposalsCompleted.length).toEqual(0);

      const resInProgress2 = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      expectListProposalsResult(resInProgress2);
    });

    it('should complete proposals after review deadline', async () => {
      await advanceTimeToSyncProposals();

      const resInProgress = await driver.actor.list_proposals({
        state: [{ in_progress: null }],
      });
      expectListProposalsResult(resInProgress);

      await advanceTimeToCompleteProposals();

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
      await advanceTimeToSyncProposals();

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
      await advanceTimeToSyncProposals();

      // only these proposals will be in progress
      const lastRvmProposalIds = await createProposalsEveryHour(5);
      lastRvmProposalIds.reverse();

      await advanceTimeToSyncProposals();

      const res = await driver.actor.list_proposals({ state: [] });
      expectListProposalsResult(
        res,
        rvmProposalsCount + lastRvmProposalIds.length,
      );
      const { proposals } = extractOkResponse(res);
      expectProposalsSortedByTimestampDesc(
        proposals.filter(p =>
          lastRvmProposalIds.includes(p.proposal.nervous_system.network.id),
        ),
      );
    });

    it('should list proposals by state in reverse chronological order', async () => {
      await advanceTimeToSyncProposals();
      // make proposals complete
      await advanceTimeToCompleteProposals();

      // only these proposals will be in progress
      const lastRvmProposalIds = await createProposalsEveryHour(5);
      lastRvmProposalIds.reverse();

      await advanceTimeToSyncProposals();

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

      await advanceTimeToCompleteProposals();

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
