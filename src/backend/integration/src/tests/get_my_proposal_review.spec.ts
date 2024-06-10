import { Identity } from '@dfinity/agent';
import { describe, beforeAll, afterAll, expect, it } from 'bun:test';
import {
  Governance,
  TestDriver,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  anonymousIdentity,
  createProposalReview,
  createProposalReviewCommit,
  extractErrResponse,
  extractOkResponse,
  validateProposalReview,
} from '../support';

describe('get my proposal review', () => {
  let driver: TestDriver;

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
    driver = await TestDriver.createWithNnsState();

    governance = new Governance(driver.pic);
  });

  afterAll(async () => {
    await driver.tearDown();
  });

  beforeAll(async () => {
    [alice, { id: aliceId }] = await driver.users.createReviewer();
    [bob] = await driver.users.createAdmin();
    [charlie] = await driver.users.createAnonymous();

    proposalReviewData = await createProposalReview(
      driver.actor,
      governance,
      alice,
    );
    for (const commitSha of [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B]) {
      await createProposalReviewCommit(
        driver.actor,
        governance,
        alice,
        commitSha,
        proposalReviewData,
      );
    }
  });

  it('should not allow anonymous principals to get their own proposal review', async () => {
    driver.actor.setIdentity(anonymousIdentity);

    const res = await driver.actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 401,
      message: 'Anonymous principals are not allowed to call this endpoint',
    });
  });

  it('should not allow admin users to get their own proposal review', async () => {
    driver.actor.setIdentity(bob);

    const res = await driver.actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 403,
      message: `Principal ${bob.getPrincipal()} must be a reviewer to call this endpoint`,
    });
  });

  it('should not allow anonymous users to get their own proposal review', async () => {
    driver.actor.setIdentity(charlie);

    const res = await driver.actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 403,
      message: `Principal ${charlie.getPrincipal()} must be a reviewer to call this endpoint`,
    });
  });

  it('should allow reviewers to get their own proposal review', async () => {
    driver.actor.setIdentity(alice);

    const res = await driver.actor.get_my_proposal_review({
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
    driver.actor.setIdentity(alice);
    const proposalId = '269a316e-589b-4c17-bca7-2ef47bea48fe';

    const res = await driver.actor.get_my_proposal_review({
      proposal_id: proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 404,
      message: `Proposal review for proposal ${proposalId} for principal ${alice.getPrincipal()} not found`,
    });
  });
});
