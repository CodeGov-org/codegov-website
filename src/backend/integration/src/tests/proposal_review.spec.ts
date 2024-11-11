import {
  describe,
  beforeEach,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'bun:test';
import type { ProposalReview, UpdateProposalReviewRequest } from '@cg/backend';
import {
  anonymousIdentity,
  controllerIdentity,
  extractErrResponse,
  extractOkResponse,
  Governance,
  dateToRfc3339,
  createProposal,
  completeProposal,
  createProposalReview,
  TestDriver,
} from '../support';

describe('Proposal Review', () => {
  let driver: TestDriver;
  let governance: Governance;

  beforeAll(async () => {
    driver = await TestDriver.createWithNnsState();
    governance = new Governance(driver.pic);
  });

  beforeEach(async () => {
    await driver.resetBackendCanister();
  });

  afterAll(async () => {
    await driver.tearDown();
  });

  describe('create proposal review', () => {
    it('should not allow anonymous principals', async () => {
      driver.actor.setIdentity(anonymousIdentity);

      const res = await driver.actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
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
      const [alice] = await driver.users.createAnonymous();
      driver.actor.setIdentity(alice);

      const resAnonymous = await driver.actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
      });
      const resAnonymousErr = extractErrResponse(resAnonymous);

      expect(resAnonymousErr).toEqual({
        code: 403,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });

      // as admin
      driver.actor.setIdentity(controllerIdentity);

      const resAdmin = await driver.actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
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
      const [reviewer, { id: reviewerId }] =
        await driver.users.createReviewer();

      const proposalId = await createProposal(
        driver.actor,
        governance,
        'Test proposal',
      );

      driver.actor.setIdentity(reviewer);

      const proposalReviewCreationDate = await driver.getCurrentDate();
      const resFull = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resFullOk = extractOkResponse(resFull);

      expect(resFullOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(proposalReviewCreationDate),
          last_updated_at: [],
          summary: ['summary'],
          review_duration_mins: [60],
          build_reproduced: [true],
          images_paths: [],
          proposal_review_commits: [],
          vote: { yes: null },
        } satisfies ProposalReview,
      });
    });

    it('should allow reviewers to create an empty proposal review', async () => {
      const [reviewer, { id: reviewerId }] =
        await driver.users.createReviewer();

      const proposalId = await createProposal(
        driver.actor,
        governance,
        'Test proposal',
      );

      driver.actor.setIdentity(reviewer);

      const proposalReviewCreationDate = await driver.getCurrentDate();
      const resEmpty = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        vote: [],
      });
      const resEmptyOk = extractOkResponse(resEmpty);

      expect(resEmptyOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(proposalReviewCreationDate),
          last_updated_at: [],
          summary: [],
          review_duration_mins: [],
          build_reproduced: [],
          images_paths: [],
          proposal_review_commits: [],
          vote: { unspecified: null },
        } satisfies ProposalReview,
      });
    });

    it('should not allow to create a review for a proposal that does not exist', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review({
        proposal_id: nonExistentProposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal with Id ${nonExistentProposalId} not found`,
      });
    });

    it('should not allow to create a review for a proposal that is completed', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const proposalId = await createProposal(
        driver.actor,
        governance,
        'Test proposal',
      );
      await completeProposal(driver.pic, driver.actor, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });

    it('should not allow to create multiple reviews for the same reviewer and proposal', async () => {
      const [alice, { id: aliceId }] = await driver.users.createReviewer();

      const proposalId = await createProposal(
        driver.actor,
        governance,
        'Test proposal',
      );

      driver.actor.setIdentity(alice);

      const resAliceCreated = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      extractOkResponse(resAliceCreated);

      const res = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resErr = extractErrResponse(res);
      expect(resErr).toEqual({
        code: 409,
        message: `User with Id ${aliceId} has already submitted a review for proposal with Id ${proposalId}`,
      });

      const [bob] = await driver.users.createReviewer();
      driver.actor.setIdentity(bob);
      const resBobCreated = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      extractOkResponse(resBobCreated);
    });

    it('should not allow to create an invalid review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const proposalId = await createProposal(
        driver.actor,
        governance,
        'Test proposal',
      );

      driver.actor.setIdentity(reviewer);

      const resEmptySummary = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [''],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
      });
      const resEmptySummaryErr = extractErrResponse(resEmptySummary);

      expect(resEmptySummaryErr).toEqual({
        code: 400,
        message: 'Summary cannot be empty',
      });

      const resLongSummary = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['a'.repeat(1501)],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
      });
      const resLongSummaryErr = extractErrResponse(resLongSummary);

      expect(resLongSummaryErr).toEqual({
        code: 400,
        message: 'Summary must be less than 1500 characters',
      });

      const resZeroDuration = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [0],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
      });
      const resZeroDurationErr = extractErrResponse(resZeroDuration);

      expect(resZeroDurationErr).toEqual({
        code: 400,
        message: 'Review duration cannot be 0',
      });

      const resLongDuration = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: ['summary'],
        review_duration_mins: [3 * 60 + 1],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
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
      driver.actor.setIdentity(anonymousIdentity);

      const res = await driver.actor.update_proposal_review({
        proposal_id: 'proposal-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ unspecified: null }],
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
      const [alice] = await driver.users.createAnonymous();
      driver.actor.setIdentity(alice);

      const resAnonymous = await driver.actor.update_proposal_review({
        proposal_id: 'proposal-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resAnonymousErr = extractErrResponse(resAnonymous);

      expect(resAnonymousErr).toEqual({
        code: 403,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });

      // as admin
      driver.actor.setIdentity(controllerIdentity);

      const resAdmin = await driver.actor.update_proposal_review({
        proposal_id: 'proposal-id',
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ no: null }],
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
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      driver.actor.setIdentity(reviewer);

      const res = await driver.actor.update_proposal_review({
        proposal_id: nonExistentProposalId,
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review for proposal with Id ${nonExistentProposalId} not found`,
      });
    });

    it('should not allow a reviewer to update a proposal review that belongs to another reviewer', async () => {
      const [alice] = await driver.users.createReviewer();
      const [bob] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        alice,
      );

      driver.actor.setIdentity(bob);

      const res = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['summary'],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review for proposal with Id ${proposalId} not found`,
      });
    });

    it('should allow a reviewer to update a proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const res = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [120],
        build_reproduced: [false],
        vote: [{ no: null }],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should allow a reviewer to publish a proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const res = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        vote: [],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow a reviewer to update a proposal review for a completed proposal', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const proposalId = await createProposal(
        driver.actor,
        governance,
        'Test proposal',
      );

      driver.actor.setIdentity(reviewer);
      const resProposalReview = await driver.actor.create_proposal_review({
        proposal_id: proposalId,
        summary: [],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      extractOkResponse(resProposalReview);

      await completeProposal(driver.pic, driver.actor, proposalId);

      const res = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
        vote: [{ yes: null }],
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message:
          'The proposal associated with this review is already completed',
      });
    });

    it('should not allow a reviewer to update a proposal review that is already published', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const resPublished = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        vote: [],
      });
      extractOkResponse(resPublished);

      const resNoStatus = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
        vote: [{ yes: null }],
      });
      const resNoStatusErr = extractErrResponse(resNoStatus);

      expect(resNoStatusErr).toEqual({
        code: 409,
        message: `Proposal review for proposal with Id ${proposalId} is already published`,
      });

      const resPublish = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
        vote: [{ no: null }],
      });
      const resPublishErr = extractErrResponse(resPublish);

      expect(resPublishErr).toEqual({
        code: 409,
        message: `Proposal review for proposal with Id ${proposalId} is already published`,
      });
    });

    it('should allow a reviewer to set a published proposal review back to draft', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const resPublished = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ published: null }],
        summary: [],
        review_duration_mins: [],
        build_reproduced: [],
        vote: [],
      });
      extractOkResponse(resPublished);

      const res = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [{ draft: null }],
        summary: ['updated summary'],
        review_duration_mins: [1],
        build_reproduced: [false],
        vote: [{ yes: null }],
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow to update a review with invalid fields', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const resEmptySummary = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: [''],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resEmptySummaryErr = extractErrResponse(resEmptySummary);

      expect(resEmptySummaryErr).toEqual({
        code: 400,
        message: 'Summary cannot be empty',
      });

      const resLongSummary = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['a'.repeat(1501)],
        review_duration_mins: [60],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resLongSummaryErr = extractErrResponse(resLongSummary);

      expect(resLongSummaryErr).toEqual({
        code: 400,
        message: 'Summary must be less than 1500 characters',
      });

      const resZeroDuration = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['summary'],
        review_duration_mins: [0],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resZeroDurationErr = extractErrResponse(resZeroDuration);

      expect(resZeroDurationErr).toEqual({
        code: 400,
        message: 'Review duration cannot be 0',
      });

      const resLongDuration = await driver.actor.update_proposal_review({
        proposal_id: proposalId,
        status: [],
        summary: ['summary'],
        review_duration_mins: [3 * 60 + 1],
        build_reproduced: [true],
        vote: [{ yes: null }],
      });
      const resLongDurationErr = extractErrResponse(resLongDuration);

      expect(resLongDurationErr).toEqual({
        code: 400,
        message: 'Review duration must be less than 180 minutes',
      });
    });

    it.each<[Partial<UpdateProposalReviewRequest>, string]>([
      [
        {
          summary: [],
          review_duration_mins: [60],
          build_reproduced: [false],
        },
        'Summary cannot be empty',
      ],
      [
        {
          summary: ['Summary'],
          review_duration_mins: [60],
          build_reproduced: [],
        },
        'Build reproduced cannot be empty',
      ],
      [
        {
          summary: ['Summary'],
          review_duration_mins: [],
          build_reproduced: [false],
        },
        'Review duration cannot be empty',
      ],
    ])(
      'should not allow to publish a review that has invalid fields',
      async (updateReq, errMsg) => {
        const [reviewer] = await driver.users.createReviewer();

        const proposalId = await createProposal(
          driver.actor,
          governance,
          'Test proposal',
        );

        driver.actor.setIdentity(reviewer);

        const resProposalReview = await driver.actor.create_proposal_review({
          proposal_id: proposalId,
          summary: [],
          review_duration_mins: [],
          build_reproduced: [],
          vote: [],
        });
        extractOkResponse(resProposalReview);

        const res = await driver.actor.update_proposal_review({
          ...updateReq,
          proposal_id: proposalId,
          status: [{ published: null }],
          vote: [],
        } as UpdateProposalReviewRequest);
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 409,
          message: `Proposal review cannot be published due to invalid field: ${errMsg}`,
        });
      },
    );
  });
});
