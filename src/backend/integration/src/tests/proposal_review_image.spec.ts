import { resolve } from 'path';
import { HttpResponse, type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  verifyRequestResponsePair,
  Request,
} from '@dfinity/response-verification';
import {
  CERTIFICATE_VERSION,
  Governance,
  anonymousIdentity,
  completeProposal,
  controllerIdentity,
  createProposalReview,
  createProposalReviewWithImage,
  createReviewer,
  extractErrResponse,
  extractOkResponse,
  filterCertificateHeaders,
  mapFromCanisterResponse,
  mapToCanisterRequest,
  publishProposalReview,
  setupBackendCanister,
} from '../support';
import { CODEGOV_LOGO_PNG } from '../fixtures';

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

const NS_PER_MS = 1e6;

/**
 * This is not a real image, but passes the checks on the canister.
 */
const VALID_IMAGE_BYTES = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

describe('Proposal Review Image', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
  let canisterId: Principal;

  let rootKey: ArrayBufferLike;

  // set to any date after the NNS state has been generated
  const currentDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  beforeAll(async () => {
    pic = await PocketIc.create(process.env.PIC_URL, {
      processingTimeoutMs: 10_000,
      nns: {
        fromPath: NNS_STATE_PATH,
        subnetId: Principal.fromText(NNS_SUBNET_ID),
      },
    });

    const subnets = pic.getApplicationSubnets();
    rootKey = await pic.getPubKey(subnets[0].id);
  });

  beforeEach(async () => {
    const fixture = await setupBackendCanister(pic, currentDate);
    actor = fixture.actor;
    canisterId = fixture.canisterId;

    governance = new Governance(pic);
  });

  afterAll(async () => {
    await pic.tearDown();
  });

  describe('create proposal review image', () => {
    describe('batch one', () => {
      it('should not allow anonymous principals', async () => {
        actor.setIdentity(anonymousIdentity);

        const res = await actor.create_proposal_review_image({
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
        actor.setIdentity(alice);

        await actor.create_my_user_profile();

        const resAnonymous = await actor.create_proposal_review_image({
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
        actor.setIdentity(controllerIdentity);

        const resAdmin = await actor.create_proposal_review_image({
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

        actor.setIdentity(reviewer);

        const res = await actor.create_proposal_review_image({
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

        const res = await actor.create_proposal_review_image({
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
    });

    describe('batch two', () => {
      it('should not allow a reviewer to create image for a proposal review of a completed proposal', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );
        await completeProposal(pic, actor, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.create_proposal_review_image({
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
    });

    describe('batch three', () => {
      it('should not allow a reviewer to create image for a proposal review that is already published', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );
        await publishProposalReview(actor, reviewer, proposalId);

        const res = await actor.create_proposal_review_image({
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
    });

    describe('batch four', () => {
      it('should allow a reviewer to upload image for a proposal review', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );

        actor.setIdentity(reviewer);

        const resUpdate = await actor.create_proposal_review_image({
          proposal_id: proposalId,
          content_type: 'image/png',
          content_bytes: CODEGOV_LOGO_PNG,
        });
        const resUpdateOk = extractOkResponse(resUpdate);

        const imagePath = resUpdateOk.path[0]!;
        expect(imagePath.startsWith('/images/reviews/')).toBe(true);

        const resGet = await actor.get_proposal_review({
          proposal_review_id: proposalReviewId,
        });
        const resGetOk = extractOkResponse(resGet);

        expect(resGetOk.proposal_review.reproduced_build_image_path[0]).toEqual(
          imagePath,
        );
      });

      it('should not allow to create image for a review with invalid fields', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );

        actor.setIdentity(reviewer);

        const resEmptyContentType = await actor.create_proposal_review_image({
          proposal_id: proposalId,
          content_type: '',
          content_bytes: VALID_IMAGE_BYTES,
        });
        const resEmptyContentTypeErr = extractErrResponse(resEmptyContentType);

        expect(resEmptyContentTypeErr).toEqual({
          code: 400,
          message: 'Content type cannot be empty',
        });

        const resWrongContentType = await actor.create_proposal_review_image({
          proposal_id: proposalId,
          content_type: 'wrong-content-type',
          content_bytes: VALID_IMAGE_BYTES,
        });
        const resWrongContentTypeErr = extractErrResponse(resWrongContentType);

        expect(resWrongContentTypeErr).toEqual({
          code: 400,
          message: 'Content type wrong-content-type not allowed',
        });

        const resEmptyContent = await actor.create_proposal_review_image({
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
  });

  describe('delete proposal review image', () => {
    it('should allow a reviewer to delete image for a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const { proposalId, proposalReviewId, imagePath } =
        await createProposalReviewWithImage(
          actor,
          governance,
          reviewer,
          VALID_IMAGE_BYTES,
        );

      actor.setIdentity(reviewer);

      const resUpdate = await actor.delete_proposal_review_image({
        proposal_id: proposalId,
        image_path: imagePath,
      });
      const resUpdateOk = extractOkResponse(resUpdate);

      expect(resUpdateOk).toEqual(null);

      const resGet = await actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resGetOk = extractOkResponse(resGet);

      expect(resGetOk.proposal_review.reproduced_build_image_path).toEqual([]);
    });

    it('should not allow a reviewer to delete non-existent image for a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const nonExistentImagePath =
        '/images/reviews/5d98f6d8-a337-47d5-b8fc-e0f230444950';

      const { proposalId, proposalReviewId, imagePath } =
        await createProposalReviewWithImage(
          actor,
          governance,
          reviewer,
          VALID_IMAGE_BYTES,
        );

      actor.setIdentity(reviewer);

      const resDelete = await actor.delete_proposal_review_image({
        proposal_id: proposalId,
        image_path: nonExistentImagePath,
      });
      const resDeleteErr = extractErrResponse(resDelete);

      expect(resDeleteErr).toEqual({
        code: 404,
        message: `Image with path ${nonExistentImagePath} not found in proposal review for proposal with Id ${proposalId}`,
      });

      const resGet = await actor.get_proposal_review({
        proposal_review_id: proposalReviewId,
      });
      const resGetOk = extractOkResponse(resGet);

      expect(resGetOk.proposal_review.reproduced_build_image_path[0]).toEqual(
        imagePath,
      );
    });
  });

  describe('http proposal review image', () => {
    const maxCertTimeOffsetNs = BigInt(5 * 60 * 1000) * BigInt(NS_PER_MS); // 5 minutes
    const currentTimeNs = BigInt(currentDate.getTime() * NS_PER_MS);

    const verifyHttpResponse = (
      request: Request,
      canisterResponse: HttpResponse,
      imageBytes: Uint8Array,
    ) => {
      const response = mapFromCanisterResponse(canisterResponse);
      expect(response.statusCode).toBe(200);
      expect(response.headers.find(h => h[0] === 'content-type')![1]).toEqual(
        'image/png',
      );
      const responseBody = response.body;
      expect(response.headers.find(h => h[0] === 'content-length')![1]).toEqual(
        imageBytes.byteLength.toString(),
      );
      expect(responseBody).toEqual(imageBytes);

      const verificationResult = verifyRequestResponsePair(
        request,
        response,
        canisterId.toUint8Array(),
        currentTimeNs,
        maxCertTimeOffsetNs,
        new Uint8Array(rootKey),
        CERTIFICATE_VERSION,
      );

      expect(verificationResult.verificationVersion).toEqual(
        CERTIFICATE_VERSION,
      );
      expect(verificationResult.response).toEqual(
        filterCertificateHeaders(response),
      );
      expect(verificationResult.response?.body).toEqual(responseBody);
    };

    describe('batch one', () => {
      it('should return the proposal review image with certificate', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { imagePath } = await createProposalReviewWithImage(
          actor,
          governance,
          reviewer,
          CODEGOV_LOGO_PNG,
        );

        const request: Request = {
          url: imagePath,
          method: 'GET',
          headers: [],
          body: new Uint8Array(),
        };
        const canisterRequest = mapToCanisterRequest(request);

        const canisterResponse = await actor.http_request(canisterRequest);
        verifyHttpResponse(request, canisterResponse, CODEGOV_LOGO_PNG);
      });

      it('should return the proposal review image with certificate after update', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId } = await createProposalReviewWithImage(
          actor,
          governance,
          reviewer,
          CODEGOV_LOGO_PNG,
        );

        actor.setIdentity(reviewer);
        const resUpdate = await actor.create_proposal_review_image({
          proposal_id: proposalId,
          content_type: 'image/png',
          content_bytes: VALID_IMAGE_BYTES,
        });
        const resUpdateOk = extractOkResponse(resUpdate);

        const imagePathUpdated = resUpdateOk.path[0]!;

        const request: Request = {
          url: imagePathUpdated,
          method: 'GET',
          headers: [],
          body: new Uint8Array(),
        };
        const canisterRequest = mapToCanisterRequest(request);

        const canisterResponse = await actor.http_request(canisterRequest);
        verifyHttpResponse(request, canisterResponse, VALID_IMAGE_BYTES);
      });

      it('should return 404 when proposal review image is deleted', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, imagePath } = await createProposalReviewWithImage(
          actor,
          governance,
          reviewer,
          CODEGOV_LOGO_PNG,
        );

        actor.setIdentity(reviewer);
        const resDelete = await actor.delete_proposal_review_image({
          proposal_id: proposalId,
          image_path: imagePath,
        });
        extractOkResponse(resDelete);

        const request: Request = {
          url: imagePath,
          method: 'GET',
          headers: [],
          body: new Uint8Array(),
        };
        const canisterRequest = mapToCanisterRequest(request);

        const canisterResponse = await actor.http_request(canisterRequest);
        expect(canisterResponse.status_code).toBe(404);
      });

      it('should return 404 when image does not exist', async () => {
        const nonExistentImageId = 'f8cbe268-fb3d-48e5-8d6b-3d0262c644b4';

        const request: Request = {
          url: `/images/reviews/${nonExistentImageId}`,
          method: 'GET',
          headers: [],
          body: new Uint8Array(),
        };
        const canisterRequest = mapToCanisterRequest(request);

        const canisterResponse = await actor.http_request(canisterRequest);
        expect(canisterResponse.status_code).toBe(404);
      });

      it('should return 405 when requesting image with invalid method', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { imagePath } = await createProposalReviewWithImage(
          actor,
          governance,
          reviewer,
          CODEGOV_LOGO_PNG,
        );

        const request: Request = {
          url: imagePath,
          method: 'POST',
          headers: [],
          body: new Uint8Array(),
        };
        const canisterRequest = mapToCanisterRequest(request);

        const canisterResponse = await actor.http_request(canisterRequest);
        expect(canisterResponse.status_code).toBe(405);
      });
    });
  });
});
