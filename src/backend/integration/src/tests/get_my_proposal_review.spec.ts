import { _SERVICE } from '@cg/backend';
import { Identity } from '@dfinity/agent';
import {
  Actor,
  PocketIc,
  SubnetStateType,
  generateRandomIdentity,
} from '@hadronous/pic';
import { describe, beforeAll, afterAll, expect, it } from 'bun:test';
import { resolve } from 'path';
import {
  Governance,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  anonymousIdentity,
  createAdmin,
  createAnonymous,
  createProposalReview,
  createProposalReviewCommit,
  createReviewer,
  extractErrResponse,
  extractOkResponse,
  setupBackendCanister,
  validateProposalReview,
} from '../support';
import { Principal } from '@dfinity/principal';

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

describe('get my proposal review', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const initialDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let alice: Identity;
  let aliceId: string;
  let bob: Identity;
  let charlie: Identity;

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

    bob = generateRandomIdentity();
    await createAdmin(actor, bob);

    charlie = generateRandomIdentity();
    await createAnonymous(actor, charlie);

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

  it('should not allow anonymous principals to get their own proposal review', async () => {
    actor.setIdentity(anonymousIdentity);

    const res = await actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 401,
      message: 'Anonymous principals are not allowed to call this endpoint',
    });
  });

  it('should not allow admin users to get their own proposal review', async () => {
    actor.setIdentity(bob);

    const res = await actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 403,
      message: `Principal ${bob.getPrincipal()} must be a reviewer to call this endpoint`,
    });
  });

  it('should not allow anonymous users to get their own proposal review', async () => {
    actor.setIdentity(charlie);

    const res = await actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 403,
      message: `Principal ${charlie.getPrincipal()} must be a reviewer to call this endpoint`,
    });
  });

  it('should allow reviewers to get their own proposal review', async () => {
    actor.setIdentity(alice);

    const res = await actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resOk = extractOkResponse(res);

    validateProposalReview(resOk, {
      proposalId: proposalReviewData.proposalId,
      userId: aliceId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
    });
  });

  it('should return a 404 if the review does not exist', async () => {
    actor.setIdentity(alice);
    const proposalId = '269a316e-589b-4c17-bca7-2ef47bea48fe';

    const res = await actor.get_my_proposal_review({
      proposal_id: proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 404,
      message: `Proposal review for proposal ${proposalId} for principal ${alice.getPrincipal()} not found`,
    });
  });
});
