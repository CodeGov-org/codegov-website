import { describe, beforeAll, afterAll, it, expect } from 'bun:test';
import { AnonymousIdentity, Identity } from '@dfinity/agent';
import {
  Governance,
  TestDriver,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  anonymousIdentity,
  controllerIdentity,
  createProposalReview,
  createProposalReviewCommit,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
  validateProposalReview,
} from '../support';

describe('get proposal review', () => {
  let driver: TestDriver;

  let alice: Identity;
  let aliceId: string;

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

  it('should allow admins and owner to get a draft proposal review', async () => {
    driver.actor.setIdentity(alice);
    const resAlice = await driver.actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resAliceOk = extractOkResponse(resAlice);
    validateProposalReview(resAliceOk, {
      proposalId: proposalReviewData.proposalId,
      userId: aliceId,
      reviewStatus: { draft: null },
      commits: { commitSha: [VALID_COMMIT_SHA_A, VALID_COMMIT_SHA_B] },
    });

    driver.actor.setIdentity(controllerIdentity);
    const resController = await driver.actor.get_proposal_review({
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

    driver.actor.setIdentity(new AnonymousIdentity());
    const res = await driver.actor.get_proposal_review({
      proposal_review_id: nonExistentProposalReviewId,
    });
    const resErr = extractErrResponse(res);
    expect(resErr).toEqual({
      code: 404,
      message: `Proposal review with Id ${nonExistentProposalReviewId} not found`,
    });
  });

  it('should fail for a draft review if the user is not an admin or the owner', async () => {
    const [bob] = await driver.users.createReviewer();

    driver.actor.setIdentity(bob);
    const resBob = await driver.actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resBobErr = extractErrResponse(resBob);
    expect(resBobErr).toEqual({
      code: 403,
      message: 'Not authorized',
    });

    driver.actor.setIdentity(new AnonymousIdentity());
    const resAnonymous = await driver.actor.get_proposal_review({
      proposal_review_id: proposalReviewData.proposalReviewId,
    });
    const resAnonymousErr = extractErrResponse(resAnonymous);
    expect(resAnonymousErr).toEqual({
      code: 403,
      message: 'Not authorized',
    });
  });

  it('should allow anonymous principals to get published proposals', async () => {
    await publishProposalReview(
      driver.actor,
      alice,
      proposalReviewData.proposalId,
    );

    driver.actor.setIdentity(anonymousIdentity);
    const res = await driver.actor.get_proposal_review({
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
