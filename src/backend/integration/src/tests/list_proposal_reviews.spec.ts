import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { describe, beforeAll, afterAll, it, expect } from 'bun:test';
import {
  Governance,
  TestDriver,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  controllerIdentity,
  createProposal,
  createProposalReview,
  createProposalReviewCommit,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
  validateProposalReview,
} from '../support';

describe('list proposal reviews', () => {
  let driver: TestDriver;
  let governance: Governance;

  let alice: Identity;
  let aliceId: string;
  let bob: Identity;
  let bobId: string;

  let proposal1Id: string;
  let proposal2Id: string;

  beforeAll(async () => {
    driver = await TestDriver.createWithNnsState();

    governance = new Governance(driver.pic);
  });

  afterAll(async () => {
    await driver.tearDown();
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

    [alice, { id: aliceId }] = await driver.users.createReviewer();
    [bob, { id: bobId }] = await driver.users.createReviewer();

    proposal1Id = (
      await createProposal(driver.actor, governance, 'Test proposal 1')
    ).proposalId;
    proposal2Id = (
      await createProposal(driver.actor, governance, 'Test proposal 2')
    ).proposalId;

    const proposal1ReviewAliceData = await createProposalReview(
      driver.actor,
      governance,
      alice,
      proposal1Id,
    );
    for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
      await createProposalReviewCommit(
        driver.actor,
        governance,
        alice,
        commitSha,
        proposal1ReviewAliceData,
      );
    }
    await publishProposalReview(
      driver.actor,
      alice,
      proposal1ReviewAliceData.proposalId,
    );
    const proposal2ReviewAliceData = await createProposalReview(
      driver.actor,
      governance,
      alice,
      proposal2Id,
    );
    await createProposalReviewCommit(
      driver.actor,
      governance,
      alice,
      VALID_COMMIT_SHA_A,
      proposal2ReviewAliceData,
    );

    const proposal1ReviewBobData = await createProposalReview(
      driver.actor,
      governance,
      bob,
      proposal1Id,
    );
    await createProposalReviewCommit(
      driver.actor,
      governance,
      bob,
      VALID_COMMIT_SHA_A,
      proposal1ReviewBobData,
    );
    const proposal2ReviewBobData = await createProposalReview(
      driver.actor,
      governance,
      bob,
      proposal2Id,
    );
    for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
      await createProposalReviewCommit(
        driver.actor,
        governance,
        bob,
        commitSha,
        proposal2ReviewBobData,
      );
    }
    await publishProposalReview(
      driver.actor,
      bob,
      proposal2ReviewBobData.proposalId,
    );
  });

  it('should allow anonymous principals', async () => {
    driver.actor.setIdentity(new AnonymousIdentity());

    const resProposal1 = await driver.actor.list_proposal_reviews({
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
      vote: { yes: null },
    });

    const resProposal2 = await driver.actor.list_proposal_reviews({
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
      vote: { yes: null },
    });

    const resAlice = await driver.actor.list_proposal_reviews({
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
      vote: { yes: null },
    });

    const resBob = await driver.actor.list_proposal_reviews({
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
      vote: { yes: null },
    });
  });

  it('should not allow invalid arguments', async () => {
    driver.actor.setIdentity(new AnonymousIdentity());

    const resEmpty = await driver.actor.list_proposal_reviews({
      proposal_id: [],
      user_id: [],
    });
    const resEmptyErr = extractErrResponse(resEmpty);
    expect(resEmptyErr).toEqual({
      code: 400,
      message: 'Must specify either proposal_id or user_id parameter',
    });

    const resTooMany = await driver.actor.list_proposal_reviews({
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
    driver.actor.setIdentity(alice);

    const resAlice = await driver.actor.list_proposal_reviews({
      proposal_id: [],
      user_id: [aliceId],
    });
    const resAliceOk = extractOkResponse(resAlice);
    expect(resAliceOk.proposal_reviews.length).toEqual(2);
    validateProposalReview(resAliceOk.proposal_reviews[0], {
      proposalId: proposal2Id,
      userId: aliceId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A] },
      vote: { yes: null },
    });
    validateProposalReview(resAliceOk.proposal_reviews[1], {
      proposalId: proposal1Id,
      userId: aliceId,
      reviewStatus: { published: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
      lastUpdatedAt: expect.any(String),
      vote: { yes: null },
    });

    const resBob = await driver.actor.list_proposal_reviews({
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
      vote: { yes: null },
    });
  });

  it('should allow admins to see all reviews', async () => {
    driver.actor.setIdentity(controllerIdentity);

    const resProposal1 = await driver.actor.list_proposal_reviews({
      proposal_id: [proposal1Id],
      user_id: [],
    });
    const resProposal1Ok = extractOkResponse(resProposal1);
    expect(resProposal1Ok.proposal_reviews.length).toEqual(2);
    validateProposalReview(resProposal1Ok.proposal_reviews[0], {
      proposalId: proposal1Id,
      userId: bobId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A] },
      vote: { yes: null },
    });
    validateProposalReview(resProposal1Ok.proposal_reviews[1], {
      proposalId: proposal1Id,
      userId: aliceId,
      reviewStatus: { published: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
      lastUpdatedAt: expect.any(String),
      vote: { yes: null },
    });

    const resProposal2 = await driver.actor.list_proposal_reviews({
      proposal_id: [proposal2Id],
      user_id: [],
    });
    const resProposal2Ok = extractOkResponse(resProposal2);
    expect(resProposal2Ok.proposal_reviews.length).toEqual(2);
    validateProposalReview(resProposal2Ok.proposal_reviews[0], {
      proposalId: proposal2Id,
      userId: bobId,
      reviewStatus: { published: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
      lastUpdatedAt: expect.any(String),
      vote: { yes: null },
    });
    validateProposalReview(resProposal2Ok.proposal_reviews[1], {
      proposalId: proposal2Id,
      userId: aliceId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A] },
      vote: { yes: null },
    });
  });

  it('should return an empty list when the proposal does not exist', async () => {
    const nonExistentProposalId = 'a79710dc-e275-4775-9bf3-4a67b30e9c30';

    driver.actor.setIdentity(new AnonymousIdentity());
    const res = await driver.actor.list_proposal_reviews({
      proposal_id: [nonExistentProposalId],
      user_id: [],
    });
    const resOk = extractOkResponse(res);
    expect(resOk.proposal_reviews.length).toEqual(0);
  });

  it('should return an empty list when there are no reviews', async () => {
    const { proposalId } = await createProposal(
      driver.actor,
      governance,
      'Test Proposal with no reviews',
    );

    driver.actor.setIdentity(new AnonymousIdentity());
    const res = await driver.actor.list_proposal_reviews({
      proposal_id: [proposalId],
      user_id: [],
    });
    const resOk = extractOkResponse(res);
    expect(resOk.proposal_reviews.length).toEqual(0);
  });

  it('should return an empty list when the user does not exist', async () => {
    const nonExistentUserId = 'b456a69a-3fef-44c4-b85e-e40ebb8f2f5e';

    driver.actor.setIdentity(new AnonymousIdentity());
    const res = await driver.actor.list_proposal_reviews({
      proposal_id: [],
      user_id: [nonExistentUserId],
    });
    const resOk = extractOkResponse(res);
    expect(resOk.proposal_reviews.length).toEqual(0);
  });
});
