import { resolve } from 'path';
import { type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  Governance,
  anonymousIdentity,
  completeProposal,
  controllerIdentity,
  createProposalReview,
  createReviewer,
  extractErrResponse,
  publishProposalReview,
  setupBackendCanister,
} from '../support';
// import { CODEGOV_LOGO_PNG } from '../fixtures';

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

/**
 * This is not a real image, but passes the checks on the canister.
 */
const VALID_IMAGE_BYTES = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

describe('Proposal Review Image', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
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
  });

  beforeEach(async () => {
    const fixture = await setupBackendCanister(pic, currentDate);
    actor = fixture.actor;

    governance = new Governance(pic);
  });

  afterAll(async () => {
    await pic.tearDown();
  });

  describe('update proposal review image', () => {
    describe('batch one', () => {
      it('should not allow anonymous principals', async () => {
        actor.setIdentity(anonymousIdentity);

        const res = await actor.update_proposal_review_image({
          proposal_id: 'proposal-id',
          operation: {
            upsert: {
              content_type: 'image/png',
              content_bytes: VALID_IMAGE_BYTES,
            },
          },
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

        const resAnonymous = await actor.update_proposal_review_image({
          proposal_id: 'proposal-id',
          operation: {
            upsert: {
              content_type: 'image/png',
              content_bytes: VALID_IMAGE_BYTES,
            },
          },
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

        const resAdmin = await actor.update_proposal_review_image({
          proposal_id: 'proposal-id',
          operation: {
            delete: null,
          },
        });
        const resAdminErr = extractErrResponse(resAdmin);

        expect(resAdminErr).toEqual({
          code: 403,
          message: `Principal ${controllerIdentity
            .getPrincipal()
            .toText()} must be a reviewer to call this endpoint`,
        });
      });

      it('should not allow to update image for a proposal review that does not exist', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

        actor.setIdentity(reviewer);

        const res = await actor.update_proposal_review_image({
          proposal_id: nonExistentProposalId,
          operation: {
            upsert: {
              content_type: 'image/png',
              content_bytes: VALID_IMAGE_BYTES,
            },
          },
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 404,
          message: `Proposal review for proposal with Id ${nonExistentProposalId} not found`,
        });
      });

      it('should not allow a reviewer to update image of a proposal review that belongs to another reviewer', async () => {
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

        const res = await actor.update_proposal_review_image({
          proposal_id: proposalId,
          operation: {
            upsert: {
              content_type: 'image/png',
              content_bytes: VALID_IMAGE_BYTES,
            },
          },
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 404,
          message: `Proposal review for proposal with Id ${proposalId} not found`,
        });
      });
    });

    describe('batch two', () => {
      it('should not allow a reviewer to update image for a proposal review of a completed proposal', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );
        await completeProposal(pic, actor, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.update_proposal_review_image({
          proposal_id: proposalId,
          operation: {
            upsert: {
              content_type: 'image/png',
              content_bytes: VALID_IMAGE_BYTES,
            },
          },
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
      it('should not allow a reviewer to update image for a proposal review that is already published', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );
        await publishProposalReview(actor, reviewer, proposalId);

        const res = await actor.update_proposal_review_image({
          proposal_id: proposalId,
          operation: {
            upsert: {
              content_type: 'image/png',
              content_bytes: VALID_IMAGE_BYTES,
            },
          },
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 409,
          message: `Proposal review for proposal with Id ${proposalId} is already published`,
        });
      });
    });
  });
});
