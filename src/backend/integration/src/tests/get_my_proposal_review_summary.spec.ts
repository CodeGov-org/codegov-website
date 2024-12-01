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
} from '../support';
import { CODEGOV_LOGO_PNG } from '../fixtures';

describe('get my proposal review summary', () => {
  let driver: TestDriver;

  let alice: Identity;
  let bob: Identity;
  let charlie: Identity;

  let governance: Governance;

  let proposalReviewData: {
    nnsProposalId?: bigint;
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
    [alice] = await driver.users.createReviewer();
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
    await driver.actor.create_proposal_review_image({
      proposal_id: proposalReviewData.proposalId,
      content_type: 'image/png',
      content_bytes: CODEGOV_LOGO_PNG,
    });
  });

  it('should not allow anonymous principals to get their own proposal review summary', async () => {
    driver.actor.setIdentity(anonymousIdentity);

    const res = await driver.actor.get_my_proposal_review_summary({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 401,
      message: 'Anonymous principals are not allowed to call this endpoint',
    });
  });

  it('should not allow admin users to get their own proposal review summary', async () => {
    driver.actor.setIdentity(bob);

    const res = await driver.actor.get_my_proposal_review_summary({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 403,
      message: `Principal ${bob.getPrincipal()} must be a reviewer to call this endpoint`,
    });
  });

  it('should not allow anonymous users to get their own proposal review summary', async () => {
    driver.actor.setIdentity(charlie);

    const res = await driver.actor.get_my_proposal_review_summary({
      proposal_id: proposalReviewData.proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 403,
      message: `Principal ${charlie.getPrincipal()} must be a reviewer to call this endpoint`,
    });
  });

  it('should allow reviewers to get their own proposal review summary', async () => {
    driver.actor.setIdentity(alice);

    const resReview = await driver.actor.get_my_proposal_review({
      proposal_id: proposalReviewData.proposalId,
    });
    const resReviewOk = extractOkResponse(resReview);
    const proposalReview = resReviewOk.proposal_review;
    // make sure the proposal review has at least one image and one commit
    expect(proposalReview.images_paths.length).toBeGreaterThan(0);
    expect(proposalReview.proposal_review_commits.length).toBeGreaterThan(0);

    const resReviewSummary = await driver.actor.get_my_proposal_review_summary({
      proposal_id: proposalReviewData.proposalId,
    });
    const resReviewSummaryOk = extractOkResponse(resReviewSummary);
    const summaryMarkdown = resReviewSummaryOk.summary_markdown;

    let expectedMarkdown = `# Proposal ${proposalReviewData.nnsProposalId?.toString()}\n\n`;
    expectedMarkdown += `Hashes match: ${proposalReview.build_reproduced[0] ? 'true' : 'false'}\n`;
    const allCommitsMatchDescription =
      proposalReview.proposal_review_commits.every(
        ({ proposal_review_commit: commit }) =>
          'reviewed' in commit.state &&
          commit.state.reviewed.matches_description[0],
      );
    expectedMarkdown += `All reviewed commits match their descriptions: ${allCommitsMatchDescription ? 'true' : 'false'}\n`;
    expectedMarkdown += `${proposalReview.images_paths
      .map(imagePath => `\n![](${imagePath})`)
      .join('\n')}\n`;
    expectedMarkdown += `\nSummary:\n${proposalReview.summary[0]}\n`;
    expectedMarkdown += '\nCommits review:\n';

    for (const {
      proposal_review_commit: commit,
    } of proposalReview.proposal_review_commits) {
      if ('reviewed' in commit.state) {
        let commitReview = `\tMatches description: ${commit.state.reviewed.matches_description}`;
        if (commit.state.reviewed.comment) {
          commitReview += `\n\tComment: ${commit.state.reviewed.comment}`;
        }
        if (commit.state.reviewed.highlights.length > 0) {
          commitReview += `\n\tHighlights: ${commit.state.reviewed.highlights.join(', ')}`;
        }
        expectedMarkdown += `- **${commit.commit_sha.slice(0, 9)}**:\n${commitReview}\n`;
      }
    }

    expect(summaryMarkdown).toEqual(expectedMarkdown);
  });

  it('should return a 404 if the review does not exist', async () => {
    driver.actor.setIdentity(alice);
    const proposalId = '269a316e-589b-4c17-bca7-2ef47bea48fe';

    const res = await driver.actor.get_my_proposal_review_summary({
      proposal_id: proposalId,
    });
    const resErr = extractErrResponse(res);

    expect(resErr).toEqual({
      code: 404,
      message: `Proposal review for proposal ${proposalId} for principal ${alice.getPrincipal()} not found`,
    });
  });
});
