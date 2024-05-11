import {
  describe,
  beforeEach,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'bun:test';
import { resolve } from 'path';
import type { ProposalReview, _SERVICE } from '@cg/backend';
import {
  PocketIc,
  type Actor,
  generateRandomIdentity,
  SubnetStateType,
} from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  anonymousIdentity,
  controllerIdentity,
  extractErrResponse,
  extractOkResponse,
  setupBackendCanister,
  Governance,
  dateToRfc3339,
  createProposal,
  completeProposal,
  createProposalReview,
  createReviewer,
  resetBackendCanister,
} from '../support';

const NNS_SUBNET_ID =
  '2o3zy-oo4hc-r3mtq-ylrpf-g6qge-qmuzn-2bsuv-d3yhd-e4qjc-6ff2b-6ae';

const NNS_STATE_PATH = resolve(
  __dirname,
  '..',
  '..',
  'state',
  'proposal_reviews_nns_state',
  'node-100',
  'state',
);

describe('Proposal Review', () => {
  let actor: Actor<_SERVICE>;
  let canisterId: Principal;
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const initialDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  beforeAll(async () => {
    pic = await PocketIc.create(process.env.PIC_URL, {
      nns: {
        state: {
          type: SubnetStateType.FromPath,
          path: NNS_STATE_PATH,
          subnetId: Principal.fromText(NNS_SUBNET_ID),
        },
      },
    });
    await pic.setTime(initialDate.getTime());

    const fixture = await setupBackendCanister(pic);
    actor = fixture.actor;
    canisterId = fixture.canisterId;

    governance = new Governance(pic);
  });

  beforeEach(async () => {
    await resetBackendCanister(pic, canisterId);
  });

  afterAll(async () => {
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

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );

      actor.setIdentity(reviewer);

      const resFull = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resFullOk = extractOkResponse(resFull);

      expect(resFullOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(initialDate),
          last_updated_at: [],
          summary: 'summary',
          review_duration_mins: 60,
          build_reproduced: true,
          images_paths: [],
          proposal_review_commits: [],
        } satisfies ProposalReview,
      });
    });

    it('should allow reviewers to create an empty proposal review', async () => {
      const reviewer = generateRandomIdentity();
      const reviewerId = await createReviewer(actor, reviewer);

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );

      actor.setIdentity(reviewer);

      const resEmpty = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
      });
      const resEmptyOk = extractOkResponse(resEmpty);

      expect(resEmptyOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(initialDate),
          last_updated_at: [],
          summary: '',
          review_duration_mins: 0,
          build_reproduced: false,
          images_paths: [],
          proposal_review_commits: [],
        } satisfies ProposalReview,
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

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );
      await completeProposal(pic, actor, proposalId);

      actor.setIdentity(reviewer);
      const res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });

    it('should not allow to create multiple reviews for the same reviewer and proposal', async () => {
      const alice = generateRandomIdentity();
      const aliceId = await createReviewer(actor, alice);

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );

      actor.setIdentity(alice);

      const resAliceCreated = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      extractOkResponse(resAliceCreated);

      const res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resErr = extractErrResponse(res);
      expect(resErr).toEqual({
        code: 409,
        message: `User with Id ${aliceId} has already submitted a review for proposal with Id ${proposalId}`,
      });

      const bob = generateRandomIdentity();
      await createReviewer(actor, bob);
      actor.setIdentity(bob);
      const resBobCreated = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      extractOkResponse(resBobCreated);
    });

    it('should not allow to create an invalid review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );

      actor.setIdentity(reviewer);

      const resEmptySummary = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [''],
        review_duration_mins: [60],
        build_reproduced: [true],
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
        proposal_id: 'proposal-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
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
        proposal_id: 'proposal-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
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
        proposal_id: 'proposal-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
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

      const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      actor.setIdentity(reviewer);

      const res = await actor.update_proposal_review({
        proposal_id: nonExistentProposalId,
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review for proposal with Id ${nonExistentProposalId} not found`,
      });
    });

    it('should not allow a reviewer to update a proposal review that belongs to another reviewer', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();
      await createReviewer(actor, alice);
      await createReviewer(actor, bob);

      const { proposalId } = await createProposalReview(
        actor,
        governance,
        alice,
      );

      actor.setIdentity(bob);

      const res = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review for proposal with Id ${proposalId} not found`,
      });
    });

    it('should allow a reviewer to update a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const { proposalId } = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const res = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [120],
        build_reproduced: [false],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should allow a reviewer to publish a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const { proposalId } = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const res = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow a reviewer to update a proposal review for a completed proposal', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );

      actor.setIdentity(reviewer);
      const resProposalReview = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      extractOkResponse(resProposalReview);

      await completeProposal(pic, actor, proposalId);

      const res = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
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

      const { proposalId } = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const resPublished = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
      });
      extractOkResponse(resPublished);

      const resNoStatus = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
      });
      const resNoStatusErr = extractErrResponse(resNoStatus);

      expect(resNoStatusErr).toEqual({
        code: 409,
        message: `Proposal review for proposal with Id ${proposalId} is already published`,
      });

      const resPublish = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
      });
      const resPublishErr = extractErrResponse(resPublish);

      expect(resPublishErr).toEqual({
        code: 409,
        message: `Proposal review for proposal with Id ${proposalId} is already published`,
      });
    });

    it('should allow a reviewer to set a published proposal review back to draft', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const { proposalId } = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const resPublished = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
      });
      extractOkResponse(resPublished);

      const res = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow to update a review with invalid fields', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const { proposalId } = await createProposalReview(
        actor,
        governance,
        reviewer,
      );

      actor.setIdentity(reviewer);

      const resEmptySummary = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: [''],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resEmptySummaryErr = extractErrResponse(resEmptySummary);

      expect(resEmptySummaryErr).toEqual({
        code: 400,
        message: 'Summary cannot be empty',
      });

      const resLongSummary = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['a'.repeat(1501)],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      const resLongSummaryErr = extractErrResponse(resLongSummary);

      expect(resLongSummaryErr).toEqual({
        code: 400,
        message: 'Summary must be less than 1500 characters',
      });

      const resZeroDuration = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['summary'],
        review_duration_mins: [0],
        build_reproduced: [true],
      });
      const resZeroDurationErr = extractErrResponse(resZeroDuration);

      expect(resZeroDurationErr).toEqual({
        code: 400,
        message: 'Review duration cannot be 0',
      });

      const resLongDuration = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['summary'],
        review_duration_mins: [3 * 60 + 1],
        build_reproduced: [true],
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

      const proposalId = await createProposal(
        actor,
        governance,
        'Test proposal',
      );

      actor.setIdentity(reviewer);

      const resProposalReview = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [60],
        build_reproduced: [true],
      });
      extractOkResponse(resProposalReview);

      const res = await actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
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
