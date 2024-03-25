import { resolve } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  anonymousIdentity,
  controllerIdentity,
  extractErrResponse,
  extractOkResponse,
  setupBackendCanister,
  Governance,
  nnsProposerIdentity,
  dateToRfc3339,
} from '../support';
import { Identity } from '@dfinity/agent';

const NNS_SUBNET_ID =
  '2o3zy-oo4hc-r3mtq-ylrpf-g6qge-qmuzn-2bsuv-d3yhd-e4qjc-6ff2b-6ae';

const NNS_STATE_PATH = resolve(
  import.meta.dir,
  '..',
  '..',
  'state',
  'proposal_reviews_nns_state',
  'node-100',
  'state',
);

type BackendActorService = Actor<_SERVICE>;

describe('Proposal Review', () => {
  let actor: BackendActorService;
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const currentDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  beforeEach(async () => {
    pic = await PocketIc.create({
      nns: {
        fromPath: NNS_STATE_PATH,
        subnetId: Principal.fromText(NNS_SUBNET_ID),
      },
    });
    const fixture = await setupBackendCanister(pic, currentDate);
    actor = fixture.actor;

    governance = new Governance(pic);
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  describe('create proposal review', () => {
    it('should not allow anonymous principals', async () => {
      actor.setIdentity(anonymousIdentity);

      const res = await actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Principal ${anonymousIdentity
          .getPrincipal()
          .toText()} must have a profile to call this endpoint`,
      });
    });

    it('should not allow non-reviewer principals', async () => {
      // as anonymous user
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      await actor.create_my_user_profile();

      const resAnonymous = await actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resAnonymousErr = extractErrResponse(resAnonymous);

      expect(resAnonymousErr).toEqual({
        code: 403,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });

      // as admin
      actor.setIdentity(controllerIdentity);

      const resAdmin = await actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resAdminErr = extractErrResponse(resAdmin);

      expect(resAdminErr).toEqual({
        code: 403,
        message: `Principal ${controllerIdentity
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });
    });

    it('should allow reviewers to create a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      const reviewerId = await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);

      actor.setIdentity(reviewer);

      const resFull = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resFullOk = extractOkResponse(resFull);

      expect(resFullOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(currentDate),
          summary: 'summary',
          review_duration_mins: 60,
          build_reproduced: true,
          reproduced_build_image_id: [],
        },
      });

      const resEmpty = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        reproduced_build_image_id: [],
      });
      const resEmptyOk = extractOkResponse(resEmpty);

      expect(resEmptyOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(currentDate),
          summary: '',
          review_duration_mins: 0,
          build_reproduced: false,
          reproduced_build_image_id: [],
        },
      });
    });

    it('should not allow to create a review for a proposal that does not exist', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      actor.setIdentity(reviewer);
      const res = await actor.create_proposal_review({
        proposal_id: nonExistentProposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal with Id ${nonExistentProposalId} not found`,
      });
    });

    it('should not allow to create a review for a proposal that is completed', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);
      await completeProposal(pic, actor, proposalId);

      actor.setIdentity(reviewer);
      const res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });

    it('should not allow to create an invalid review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);

      actor.setIdentity(reviewer);

      const resEmptySummary = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [''],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resEmptySummaryErr = extractErrResponse(resEmptySummary);

      expect(resEmptySummaryErr).toEqual({
        code: 400,
        message: 'Summary cannot be empty',
      });

      const resLongSummary = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['a'.repeat(1501)],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resLongSummaryErr = extractErrResponse(resLongSummary);

      expect(resLongSummaryErr).toEqual({
        code: 400,
        message: 'Summary must be less than 1500 characters',
      });

      const resZeroDuration = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [0],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resZeroDurationErr = extractErrResponse(resZeroDuration);

      expect(resZeroDurationErr).toEqual({
        code: 400,
        message: 'Review duration cannot be 0',
      });

      const resLongDuration = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [3 * 60 + 1],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resLongDurationErr = extractErrResponse(resLongDuration);

      expect(resLongDurationErr).toEqual({
        code: 400,
        message: 'Review duration must be less than 180 minutes',
      });
    });
  });

  describe('update proposal review', () => {
    it('should not allow anonymous principals', async () => {
      actor.setIdentity(anonymousIdentity);

      const res = await actor.update_proposal_review({
        id: 'proposal-review-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Principal ${anonymousIdentity
          .getPrincipal()
          .toText()} must have a profile to call this endpoint`,
      });
    });

    it('should not allow non-reviewer principals', async () => {
      // as anonymous user
      const alice = generateRandomIdentity();
      actor.setIdentity(alice);

      await actor.create_my_user_profile();

      const resAnonymous = await actor.update_proposal_review({
        id: 'proposal-review-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resAnonymousErr = extractErrResponse(resAnonymous);

      expect(resAnonymousErr).toEqual({
        code: 403,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });

      // as admin
      actor.setIdentity(controllerIdentity);

      const resAdmin = await actor.update_proposal_review({
        id: 'proposal-review-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resAdminErr = extractErrResponse(resAdmin);

      expect(resAdminErr).toEqual({
        code: 403,
        message: `Principal ${controllerIdentity
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });
    });

    it('should not allow to update a proposal review that does not exist', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const nonExistentProposalReviewId =
        'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      actor.setIdentity(reviewer);

      const res = await actor.update_proposal_review({
        id: nonExistentProposalReviewId,
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review with Id ${nonExistentProposalReviewId} not found`,
      });
    });

    it('should not allow a reviewer to update a proposal review that belongs to another reviewer', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();
      await createReviewer(actor, alice);
      await createReviewer(actor, bob);

      const proposalReviewId = await createProposalReview(
        actor,
        governance,
        alice,
      );

      actor.setIdentity(bob);

      const res = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: 'User is not allowed to update this proposal review',
      });
    });

    it('should allow a reviewer to update a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalReviewId = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const res = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [120],
        build_reproduced: [false],
        reproduced_build_image_id: [],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should allow a reviewer to publish a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalReviewId = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const res = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        reproduced_build_image_id: [],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow a reviewer to update a proposal review for a completed proposal', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);

      actor.setIdentity(reviewer);
      const resProposalReview = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const { id: proposalReviewId } = extractOkResponse(resProposalReview);

      await completeProposal(pic, actor, proposalId);

      const res = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message:
          'The proposal associated with this review is already completed',
      });
    });

    it('should not allow a reviewer to update a proposal review that is already published', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalReviewId = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const resPublished = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        reproduced_build_image_id: [],
      });
      extractOkResponse(resPublished);

      const res = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal review with Id ${proposalReviewId} is already published`,
      });
    });

    it('should not allow to update a review with invalid fields', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalReviewId = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const resEmptySummary = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [],
        summary: [''],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resEmptySummaryErr = extractErrResponse(resEmptySummary);

      expect(resEmptySummaryErr).toEqual({
        code: 400,
        message: 'Summary cannot be empty',
      });

      const resLongSummary = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [],
        summary: ['a'.repeat(1501)],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resLongSummaryErr = extractErrResponse(resLongSummary);

      expect(resLongSummaryErr).toEqual({
        code: 400,
        message: 'Summary must be less than 1500 characters',
      });

      const resZeroDuration = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [],
        summary: ['summary'],
        review_duration_mins: [0],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resZeroDurationErr = extractErrResponse(resZeroDuration);

      expect(resZeroDurationErr).toEqual({
        code: 400,
        message: 'Review duration cannot be 0',
      });

      const resLongDuration = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [],
        summary: ['summary'],
        review_duration_mins: [3 * 60 + 1],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const resLongDurationErr = extractErrResponse(resLongDuration);

      expect(resLongDurationErr).toEqual({
        code: 400,
        message: 'Review duration must be less than 180 minutes',
      });
    });

    it('should not allow to publish a review that has invalid fields', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);

      actor.setIdentity(reviewer);

      const resProposalReview = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [60],
        build_reproduced: [true],
        reproduced_build_image_id: [],
      });
      const { id: proposalReviewId } = extractOkResponse(resProposalReview);

      const res = await actor.update_proposal_review({
        id: proposalReviewId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        reproduced_build_image_id: [],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message:
          'Proposal review cannot be published due to invalid field: Summary cannot be empty',
      });
    });
  });
});

async function createReviewer(
  actor: BackendActorService,
  reviewer: Identity,
): Promise<string> {
  actor.setIdentity(reviewer);
  const reviewerCreateRes = await actor.create_my_user_profile();
  const reviewerCreate = extractOkResponse(reviewerCreateRes);

  actor.setIdentity(controllerIdentity);
  await actor.update_user_profile({
    user_id: reviewerCreate.id,
    username: ['reviewer'],
    config: [
      {
        reviewer: {
          bio: [],
          wallet_address: [],
          neuron_id: [],
          social_links: [],
        },
      },
    ],
  });

  return reviewerCreate.id;
}

/**
 * Creates an RVM proposal, syncs the proposals on the backend canister
 * and returns the backend proposal id.
 */
async function createProposal(
  actor: BackendActorService,
  governance: Governance,
): Promise<string> {
  const neuronId = await governance.createNeuron(nnsProposerIdentity);

  await governance.createRvmProposal(nnsProposerIdentity, {
    neuronId: neuronId,
    title: 'Test Proposal',
    summary: 'Test Proposal Summary',
    replicaVersion: 'ca82a6dff817ec66f44342007202690a93763949',
  });

  actor.setIdentity(controllerIdentity);

  await actor.sync_proposals();
  const res = await actor.list_proposals({
    state: [{ in_progress: null }],
  });
  const { proposals } = extractOkResponse(res);

  return proposals[0].id;
}

async function completeProposal(
  pic: PocketIc,
  actor: BackendActorService,
  proposalId: string,
) {
  // advance time to make the proposal expire
  await pic.advanceTime(48 * 60 * 60 * 1000); // 48 hours
  // ensure timers run
  await pic.tick(2);

  const res = await actor.list_proposals({
    state: [{ completed: null }],
  });
  const { proposals } = extractOkResponse(res);

  const completedProposal = proposals[0];
  if (completedProposal.id !== proposalId) {
    throw new Error(
      `Expected proposal id ${proposalId} but got ${completedProposal.id}`,
    );
  }
}

async function createProposalReview(
  actor: BackendActorService,
  governance: Governance,
  reviewer: Identity,
): Promise<string> {
  const proposalId = await createProposal(actor, governance);

  actor.setIdentity(reviewer);
  const res = await actor.create_proposal_review({
    proposal_id: proposalId,
    summary: ['summary'],
    review_duration_mins: [60],
    build_reproduced: [true],
    reproduced_build_image_id: [],
  });
  const { id } = extractOkResponse(res);

  return id;
}
