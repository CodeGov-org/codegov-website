import { describe, beforeAll, afterAll, it, expect } from 'bun:test';
import { _SERVICE } from '@cg/backend';
import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import {
  Actor,
  PocketIc,
  SubnetStateType,
  generateRandomIdentity,
} from '@hadronous/pic';
import {
  Governance,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  anonymousIdentity,
  controllerIdentity,
  createProposalReview,
  createProposalReviewCommit,
  createReviewer,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
  setupBackendCanister,
  validateProposalReview,
} from '../support';
import { resolve } from 'path';

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

describe('get proposal review', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const initialDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let alice: Identity;
  let aliceId: string;

  let governance: Governance;

  let proposalReviewData: {
    proposalId: string;
    proposalReviewId: string;
  };

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

    governance = new Governance(pic);
  });

  afterAll(async () => {
    await pic.tearDown();
  });

  beforeAll(async () => {
    alice = generateRandomIdentity();
    aliceId = await createReviewer(actor, alice);

    proposalReviewData = await createProposalReview(actor, governance, alice);
    for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
      await createProposalReviewCommit(
        actor,
        governance,
        alice,
        commitSha,
        proposalReviewData,
      );
    }
  });

  it('should allow admins and owner to get a draft proposal review', async () => {
    actor.setIdentity(alice);
    const resAlice = await actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resAliceOk = extractOkResponse(resAlice);
    validateProposalReview(resAliceOk, {
      proposalId: proposalReviewData.proposalId,
      userId: aliceId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
    });

    actor.setIdentity(controllerIdentity);
    const resController = await actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resControllerOk = extractOkResponse(resController);
    validateProposalReview(resControllerOk, {
      proposalId: proposalReviewData.proposalId,
      userId: aliceId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
    });
  });

  it('should fail for a non-existent proposal review', async () => {
    const nonExistentProposalReviewId = '269a316e-589b-4c17-bca7-2ef47bea48fe';

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
    const bob = generateRandomIdentity();
    await createReviewer(actor, bob);

    actor.setIdentity(bob);
    const resBob = await actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resBobErr = extractErrResponse(resBob);
    expect(resBobErr).toEqual({
      code: 403,
      message: 'Not authorized',
    });

    actor.setIdentity(new AnonymousIdentity());
    const resAnonymous = await actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resAnonymousErr = extractErrResponse(resAnonymous);
    expect(resAnonymousErr).toEqual({
      code: 403,
      message: 'Not authorized',
    });
  });

  it('should allow anonymous principals to get published proposals', async () => {
    await publishProposalReview(actor, alice, proposalReviewData.proposalId);

    actor.setIdentity(anonymousIdentity);
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
});
