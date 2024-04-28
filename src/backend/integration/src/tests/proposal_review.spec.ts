import { resolve } from 'path';
import type {
  ProposalReview,
  ProposalReviewCommitWithId,
  ProposalReviewStatus,
  ProposalReviewWithId,
  _SERVICE,
} from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
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
  publishProposalReview,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  createProposalReviewCommit,
} from '../support';
import { AnonymousIdentity, Identity } from '@dfinity/agent';

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
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const currentDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  beforeEach(async () => {
    pic = await PocketIc.create(process.env.PIC_URL, {
      processingTimeoutMs: 10_000,
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
          created_at: dateToRfc3339(currentDate),
          last_updated_at: [],
          summary: 'summary',
          review_duration_mins: 60,
          build_reproduced: true,
          reproduced_build_image_path: [],
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
          created_at: dateToRfc3339(currentDate),
          last_updated_at: [],
          summary: '',
          review_duration_mins: 0,
          build_reproduced: false,
          reproduced_build_image_path: [],
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
    describe('batch one', () => {
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
    });

    describe('batch two', () => {
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

  describe('list proposal reviews', () => {
    let alice: Identity;
    let aliceId: string;
    let bob: Identity;
    let bobId: string;

    let proposal1Id: string;
    let proposal2Id: string;

    beforeEach(async () => {
      /**
       * Create some test data
       *
       * Test data structure:
       * proposal 1:
       *   review 1:
       *     reviewer: alice
       *     status: published
       *     commits: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]
       *   review 2:
       *     reviewer: bob
       *     status: draft
       *     commits: [VALID_COMMIT_SHA_A]
       * proposal 2:
       *   review 1:
       *     reviewer: alice
       *     status: draft
       *     commits: [VALID_COMMIT_SHA_A]
       *   review 2:
       *     reviewer: bob
       *     status: published
       *     commits: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]
       */

      alice = generateRandomIdentity();
      bob = generateRandomIdentity();

      aliceId = await createReviewer(actor, alice);
      bobId = await createReviewer(actor, bob);

      proposal1Id = await createProposal(actor, governance, 'Test proposal 1');
      proposal2Id = await createProposal(actor, governance, 'Test proposal 2');

      const proposal1ReviewAliceData = await createProposalReview(
        actor,
        governance,
        alice,
        proposal1Id,
      );
      for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
        await createProposalReviewCommit(
          actor,
          governance,
          alice,
          commitSha,
          proposal1ReviewAliceData,
        );
      }
      await publishProposalReview(
        actor,
        alice,
        proposal1ReviewAliceData.proposalId,
      );
      const proposal2ReviewAliceData = await createProposalReview(
        actor,
        governance,
        alice,
        proposal2Id,
      );
      await createProposalReviewCommit(
        actor,
        governance,
        alice,
        VALID_COMMIT_SHA_A,
        proposal2ReviewAliceData,
      );

      const proposal1ReviewBobData = await createProposalReview(
        actor,
        governance,
        bob,
        proposal1Id,
      );
      await createProposalReviewCommit(
        actor,
        governance,
        bob,
        VALID_COMMIT_SHA_A,
        proposal1ReviewBobData,
      );
      const proposal2ReviewBobData = await createProposalReview(
        actor,
        governance,
        bob,
        proposal2Id,
      );
      for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
        await createProposalReviewCommit(
          actor,
          governance,
          bob,
          commitSha,
          proposal2ReviewBobData,
        );
      }
      await publishProposalReview(
        actor,
        bob,
        proposal2ReviewBobData.proposalId,
      );
    });

    describe('batch one', () => {
      it('should allow anonymous principals', async () => {
        actor.setIdentity(new AnonymousIdentity());

        const resProposal1 = await actor.list_proposal_reviews({
          proposal_id: [proposal1Id],
          user_id: [],
        });
        const resProposal1Ok = extractOkResponse(resProposal1);
        expect(resProposal1Ok.proposal_reviews.length).toEqual(1);
        validateProposalReview(resProposal1Ok.proposal_reviews[0], {
          proposalId: proposal1Id,
          userId: aliceId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });

        const resProposal2 = await actor.list_proposal_reviews({
          proposal_id: [proposal2Id],
          user_id: [],
        });
        const resProposal2Ok = extractOkResponse(resProposal2);
        expect(resProposal2Ok.proposal_reviews.length).toEqual(1);
        validateProposalReview(resProposal2Ok.proposal_reviews[0], {
          proposalId: proposal2Id,
          userId: bobId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });

        const resAlice = await actor.list_proposal_reviews({
          proposal_id: [],
          user_id: [aliceId],
        });
        const resAliceOk = extractOkResponse(resAlice);
        expect(resAliceOk.proposal_reviews.length).toEqual(1);
        validateProposalReview(resAliceOk.proposal_reviews[0], {
          proposalId: proposal1Id,
          userId: aliceId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });

        const resBob = await actor.list_proposal_reviews({
          proposal_id: [],
          user_id: [bobId],
        });
        const resBobOk = extractOkResponse(resBob);
        expect(resBobOk.proposal_reviews.length).toEqual(1);
        validateProposalReview(resBobOk.proposal_reviews[0], {
          proposalId: proposal2Id,
          userId: bobId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });
      });

      it('should not allow invalid arguments', async () => {
        actor.setIdentity(new AnonymousIdentity());

        const resEmpty = await actor.list_proposal_reviews({
          proposal_id: [],
          user_id: [],
        });
        const resEmptyErr = extractErrResponse(resEmpty);
        expect(resEmptyErr).toEqual({
          code: 400,
          message: 'Must specify either proposal_id or user_id parameter',
        });

        const resTooMany = await actor.list_proposal_reviews({
          proposal_id: [proposal1Id],
          user_id: [aliceId],
        });
        const resTooManyErr = extractErrResponse(resTooMany);
        expect(resTooManyErr).toEqual({
          code: 400,
          message: 'Cannot specify both proposal_id and user_id parameters',
        });
      });

      it('should allow review owners to see their draft reviews', async () => {
        actor.setIdentity(alice);

        const resAlice = await actor.list_proposal_reviews({
          proposal_id: [],
          user_id: [aliceId],
        });
        const resAliceOk = extractOkResponse(resAlice);
        expect(resAliceOk.proposal_reviews.length).toEqual(2);
        validateProposalReview(resAliceOk.proposal_reviews[0], {
          proposalId: proposal1Id,
          userId: aliceId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });
        validateProposalReview(resAliceOk.proposal_reviews[1], {
          proposalId: proposal2Id,
          userId: aliceId,
          reviewStatus: { draft: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A] },
        });

        const resBob = await actor.list_proposal_reviews({
          proposal_id: [],
          user_id: [bobId],
        });
        const resBobOk = extractOkResponse(resBob);
        expect(resBobOk.proposal_reviews.length).toEqual(1);
        validateProposalReview(resBobOk.proposal_reviews[0], {
          proposalId: proposal2Id,
          userId: bobId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });
      });
    });

    describe('batch two', () => {
      it('should allow admins to see all reviews', async () => {
        actor.setIdentity(controllerIdentity);

        const resProposal1 = await actor.list_proposal_reviews({
          proposal_id: [proposal1Id],
          user_id: [],
        });
        const resProposal1Ok = extractOkResponse(resProposal1);
        expect(resProposal1Ok.proposal_reviews.length).toEqual(2);
        validateProposalReview(resProposal1Ok.proposal_reviews[0], {
          proposalId: proposal1Id,
          userId: aliceId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });
        validateProposalReview(resProposal1Ok.proposal_reviews[1], {
          proposalId: proposal1Id,
          userId: bobId,
          reviewStatus: { draft: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A] },
        });

        const resProposal2 = await actor.list_proposal_reviews({
          proposal_id: [proposal2Id],
          user_id: [],
        });
        const resProposal2Ok = extractOkResponse(resProposal2);
        expect(resProposal2Ok.proposal_reviews.length).toEqual(2);
        validateProposalReview(resProposal2Ok.proposal_reviews[0], {
          proposalId: proposal2Id,
          userId: aliceId,
          reviewStatus: { draft: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A] },
        });
        validateProposalReview(resProposal2Ok.proposal_reviews[1], {
          proposalId: proposal2Id,
          userId: bobId,
          reviewStatus: { published: null },
          commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
          lastUpdatedAt: expect.any(String),
        });
      });

      it('should return an empty list when the proposal does not exist', async () => {
        const nonExistentProposalId = 'a79710dc-e275-4775-9bf3-4a67b30e9c30';

        actor.setIdentity(new AnonymousIdentity());
        const res = await actor.list_proposal_reviews({
          proposal_id: [nonExistentProposalId],
          user_id: [],
        });
        const resOk = extractOkResponse(res);
        expect(resOk.proposal_reviews.length).toEqual(0);
      });
    });

    describe('batch three', () => {
      it('should return an empty list when there are no reviews', async () => {
        const proposalId = await createProposal(
          actor,
          governance,
          'Test Proposal with no reviews',
        );

        actor.setIdentity(new AnonymousIdentity());
        const res = await actor.list_proposal_reviews({
          proposal_id: [proposalId],
          user_id: [],
        });
        const resOk = extractOkResponse(res);
        expect(resOk.proposal_reviews.length).toEqual(0);
      });

      it('should return an empty list when the user does not exist', async () => {
        const nonExistentUserId = 'b456a69a-3fef-44c4-b85e-e40ebb8f2f5e';

        actor.setIdentity(new AnonymousIdentity());
        const res = await actor.list_proposal_reviews({
          proposal_id: [],
          user_id: [nonExistentUserId],
        });
        const resOk = extractOkResponse(res);
        expect(resOk.proposal_reviews.length).toEqual(0);
      });
    });
  });

  describe('get proposal review', () => {
    it('should allow anonymous principals', async () => {
      const alice = generateRandomIdentity();
      const aliceId = await createReviewer(actor, alice);

      const proposalReviewData = await createProposalReview(
        actor,
        governance,
        alice,
      );
      for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
        await createProposalReviewCommit(
          actor,
          governance,
          alice,
          commitSha,
          proposalReviewData,
        );
      }
      await publishProposalReview(actor, alice, proposalReviewData.proposalId);

      actor.setIdentity(new AnonymousIdentity());
      const res = await actor.get_proposal_review({
        proposal_review_id: proposalReviewData.proposalReviewId,
      });
      const resOk = extractOkResponse(res);
      validateProposalReview(resOk, {
        proposalId: proposalReviewData.proposalId,
        userId: aliceId,
        reviewStatus: { published: null },
        commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
        lastUpdatedAt: expect.any(String),
      });
    });

    it('should allow admins and owner to get a draft proposal review', async () => {
      const alice = generateRandomIdentity();
      const aliceId = await createReviewer(actor, alice);

      const { proposalId, proposalReviewId } = await createProposalReviewCommit(
        actor,
        governance,
        alice,
        VALID_COMMIT_SHA_A,
      );

      actor.setIdentity(alice);
      const resAlice = await actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resAliceOk = extractOkResponse(resAlice);
      validateProposalReview(resAliceOk, {
        proposalId,
        userId: aliceId,
        reviewStatus: { draft: null },
        commits: { commitSha: [VALID_COMMIT_SHA_A] },
      });

      actor.setIdentity(controllerIdentity);
      const resController = await actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resControllerOk = extractOkResponse(resController);
      validateProposalReview(resControllerOk, {
        proposalId,
        userId: aliceId,
        reviewStatus: { draft: null },
        commits: { commitSha: [VALID_COMMIT_SHA_A] },
      });
    });

    it('should fail for a non-existent proposal review', async () => {
      const nonExistentProposalReviewId =
        '269a316e-589b-4c17-bca7-2ef47bea48fe';

      actor.setIdentity(new AnonymousIdentity());
      const res = await actor.get_proposal_review({
        proposal_review_id: nonExistentProposalReviewId,
      });
      const resErr = extractErrResponse(res);
      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review with Id ${nonExistentProposalReviewId} not found`,
      });
    });

    it('should fail for a draft review if the user is not an admin or the owner', async () => {
      const alice = generateRandomIdentity();
      const bob = generateRandomIdentity();
      await createReviewer(actor, alice);
      await createReviewer(actor, bob);

      const { proposalReviewId } = await createProposalReview(
        actor,
        governance,
        alice,
      );

      actor.setIdentity(bob);
      const resBob = await actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resBobErr = extractErrResponse(resBob);
      expect(resBobErr).toEqual({
        code: 403,
        message: 'Not authorized',
      });

      actor.setIdentity(new AnonymousIdentity());
      const resAnonymous = await actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resAnonymousErr = extractErrResponse(resAnonymous);
      expect(resAnonymousErr).toEqual({
        code: 403,
        message: 'Not authorized',
      });
    });
  });
});

type ExpectedProposalReviewFields = {
  proposalId: string;
  userId: string;
  reviewStatus: ProposalReviewStatus;
  lastUpdatedAt?: string;
  commits: {
    commitSha: string[];
  };
};

function validateProposalReview(
  proposalReview: ProposalReviewWithId,
  expected: ExpectedProposalReviewFields,
) {
  expect(proposalReview).toEqual({
    id: expect.any(String),
    proposal_review: {
      proposal_id: expected.proposalId,
      user_id: expected.userId,
      status: expected.reviewStatus,
      created_at: expect.any(String),
      last_updated_at: expected.lastUpdatedAt ? [expected.lastUpdatedAt] : [],
      summary: expect.any(String),
      review_duration_mins: expect.any(Number),
      build_reproduced: expect.any(Boolean),
      reproduced_build_image_path: expect.any(Array),
      proposal_review_commits: expected.commits.commitSha.map(
        commitSha =>
          ({
            id: expect.any(String),
            proposal_review_commit: {
              commit_sha: commitSha,
              user_id: expected.userId,
              proposal_review_id: expect.any(String),
              created_at: expect.any(String),
              last_updated_at: [],
              state: expect.anything(),
            },
          }) satisfies ProposalReviewCommitWithId,
      ),
    },
  } satisfies ProposalReviewWithId);
}
