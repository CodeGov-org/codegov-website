import {
  describe,
  beforeEach,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'bun:test';
import { generateRandomIdentity } from '@hadronous/pic';
import {
  Governance,
  TestDriver,
  VALID_IMAGE_BYTES,
  anonymousIdentity,
  completeProposal,
  controllerIdentity,
  createProposalReview,
  createProposalReviewWithImage,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
} from '../support';
import { CODEGOV_LOGO_PNG } from '../fixtures';

describe('Proposal Review Image', () => {
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

  describe('create proposal review image', () => {
    it('should not allow anonymous principals', async () => {
      driver.actor.setIdentity(anonymousIdentity);

      const res = await driver.actor.create_proposal_review_image({
        proposal_id: 'proposal-id',
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
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
      driver.actor.setIdentity(alice);

      await driver.actor.create_my_user_profile();

      const resAnonymous = await driver.actor.create_proposal_review_image({
        proposal_id: 'proposal-id',
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
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

      const resAdmin = await driver.actor.create_proposal_review_image({
        proposal_id: 'proposal-id',
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
      });
      const resAdminErr = extractErrResponse(resAdmin);

      expect(resAdminErr).toEqual({
        code: 403,
        message: `Principal ${controllerIdentity
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });
    });

    it('should not allow to create image for a proposal review that does not exist', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      driver.actor.setIdentity(reviewer);

      const res = await driver.actor.create_proposal_review_image({
        proposal_id: nonExistentProposalId,
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review for proposal with Id ${nonExistentProposalId} not found`,
      });
    });

    it('should not allow a reviewer to create image of a proposal review that belongs to another reviewer', async () => {
      const [alice] = await driver.users.createReviewer();
      const [bob] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        alice,
      );

      driver.actor.setIdentity(bob);

      const res = await driver.actor.create_proposal_review_image({
        proposal_id: proposalId,
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review for proposal with Id ${proposalId} not found`,
      });
    });

    it('should not allow a reviewer to create image for a proposal review of a completed proposal', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );
      await completeProposal(driver.pic, driver.actor, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review_image({
        proposal_id: proposalId,
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message:
          'The proposal associated with this review is already completed',
      });
    });

    it('should not allow a reviewer to create image for a proposal review that is already published', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );
      await publishProposalReview(driver.actor, reviewer, proposalId);

      const res = await driver.actor.create_proposal_review_image({
        proposal_id: proposalId,
        content_type: 'image/png',
        content_bytes: VALID_IMAGE_BYTES,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal review for proposal with Id ${proposalId} is already published`,
      });
    });

    it('should allow a reviewer to upload image for a proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const resCreate = await driver.actor.create_proposal_review_image({
        proposal_id: proposalId,
        content_type: 'image/png',
        content_bytes: CODEGOV_LOGO_PNG,
      });
      const resCreateOk = extractOkResponse(resCreate);

      const imagePath = resCreateOk.path;
      expect(imagePath.startsWith('/images/reviews/')).toBe(true);

      const resGet = await driver.actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resGetOk = extractOkResponse(resGet);

      expect(resGetOk.proposal_review.images_paths).toEqual([imagePath]);
    });

    it('should not allow to create image for a review with invalid fields', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const resEmptyContentType =
        await driver.actor.create_proposal_review_image({
          proposal_id: proposalId,
          content_type: '',
          content_bytes: VALID_IMAGE_BYTES,
        });
      const resEmptyContentTypeErr = extractErrResponse(resEmptyContentType);

      expect(resEmptyContentTypeErr).toEqual({
        code: 400,
        message: 'Content type cannot be empty',
      });

      const resWrongContentType =
        await driver.actor.create_proposal_review_image({
          proposal_id: proposalId,
          content_type: 'wrong-content-type',
          content_bytes: VALID_IMAGE_BYTES,
        });
      const resWrongContentTypeErr = extractErrResponse(resWrongContentType);

      expect(resWrongContentTypeErr).toEqual({
        code: 400,
        message: 'Content type wrong-content-type not allowed',
      });

      const resEmptyContent = await driver.actor.create_proposal_review_image({
        proposal_id: proposalId,
        content_type: 'image/png',
        content_bytes: new Uint8Array(),
      });
      const resEmptyContentErr = extractErrResponse(resEmptyContent);

      expect(resEmptyContentErr).toEqual({
        code: 400,
        message: 'Image content cannot be empty',
      });
    });
  });

  describe('delete proposal review image', () => {
    it('should allow a reviewer to delete image for a proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId, imagePath } =
        await createProposalReviewWithImage(
          driver.actor,
          governance,
          reviewer,
          VALID_IMAGE_BYTES,
        );

      driver.actor.setIdentity(reviewer);

      const resDelete = await driver.actor.delete_proposal_review_image({
        proposal_id: proposalId,
        image_path: imagePath,
      });
      const resDeleteOk = extractOkResponse(resDelete);

      expect(resDeleteOk).toEqual(null);

      const resGet = await driver.actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resGetOk = extractOkResponse(resGet);

      expect(resGetOk.proposal_review.images_paths).toEqual([]);
    });

    it('should not allow a reviewer to delete non-existent image for a proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentImagePath =
        '/images/reviews/5d98f6d8-a337-47d5-b8fc-e0f230444950';

      const { proposalId, proposalReviewId, imagePath } =
        await createProposalReviewWithImage(
          driver.actor,
          governance,
          reviewer,
          VALID_IMAGE_BYTES,
        );

      driver.actor.setIdentity(reviewer);

      const resDelete = await driver.actor.delete_proposal_review_image({
        proposal_id: proposalId,
        image_path: nonExistentImagePath,
      });
      const resDeleteErr = extractErrResponse(resDelete);

      expect(resDeleteErr).toEqual({
        code: 404,
        message: `Image with path ${nonExistentImagePath} not found in proposal review for proposal with Id ${proposalId}`,
      });

      const resGet = await driver.actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resGetOk = extractOkResponse(resGet);

      expect(resGetOk.proposal_review.images_paths).toEqual([imagePath]);
    });
  });
});
