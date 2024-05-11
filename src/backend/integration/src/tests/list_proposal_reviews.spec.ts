import { AnonymousIdentity, Identity } from '@dfinity/agent';
import {
  Actor,
  PocketIc,
  SubnetStateType,
  generateRandomIdentity,
} from '@hadronous/pic';
import { describe, beforeAll, afterAll, it, expect } from 'bun:test';
import {
  Governance,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  controllerIdentity,
  createProposal,
  createProposalReview,
  createProposalReviewCommit,
  createReviewer,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
  setupBackendCanister,
  validateProposalReview,
} from '../support';
import { _SERVICE } from '@cg/backend';
import { Principal } from '@dfinity/principal';
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

describe('list proposal reviews', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const initialDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  let alice: Identity;
  let aliceId: string;
  let bob: Identity;
  let bobId: string;

  let proposal1Id: string;
  let proposal2Id: string;

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
    await publishProposalReview(actor, bob, proposal2ReviewBobData.proposalId);
  });

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
