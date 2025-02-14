import {
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  it,
  expect,
} from 'bun:test';
import {
  Governance,
  TestDriver,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  anonymousIdentity,
  completeProposal,
  controllerIdentity,
  createProposalReview,
  createProposalReviewCommit,
  dateToRfc3339,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
} from '../support';

const MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER = 50;

describe('Proposal Review Commit', () => {
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

  describe('create proposal review commit', () => {
    it('should not allow anonymous principals', async () => {
      driver.actor.setIdentity(anonymousIdentity);

      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: 'proposal-id',
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: [],
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
      const [anonymousIdentity] = await driver.users.createAnonymous();
      driver.actor.setIdentity(anonymousIdentity);

      const resAnonymous = await driver.actor.create_proposal_review_commit({
        proposal_review_id: 'proposal-id',
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [],
            comment: ['comment'],
          },
        },
      });
      const resAnonymousErr = extractErrResponse(resAnonymous);

      expect(resAnonymousErr).toEqual({
        code: 403,
        message: `Principal ${anonymousIdentity
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });

      // as admin
      driver.actor.setIdentity(controllerIdentity);

      const resAdmin = await driver.actor.create_proposal_review_commit({
        proposal_review_id: 'proposal-id',
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
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

    it('should allow reviewers to create a proposal review commit', async () => {
      const [reviewer, { id: reviewerId }] =
        await driver.users.createReviewer();

      const { proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const commitCreationTime = await driver.getCurrentDate();
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
        },
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toEqual({
        id: expect.any(String),
        proposal_review_commit: {
          proposal_review_id: proposalReviewId,
          user_id: reviewerId,
          commit_sha: VALID_COMMIT_SHA_A,
          created_at: dateToRfc3339(commitCreationTime),
          last_updated_at: [],
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
            },
          },
        },
      });
    });

    it('should not allow to create a review commit for a non-existing proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentProposalReviewId =
        '6f4bc04d-e0eb-4a9e-806e-e54b0cb1c270';

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: nonExistentProposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          not_reviewed: null,
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review with Id ${nonExistentProposalReviewId} not found`,
      });
    });

    it('should not allow to create a review commit for a published proposal review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );
      await publishProposalReview(driver.actor, reviewer, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [],
            comment: [],
          },
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal review with Id ${proposalReviewId} is already published`,
      });
    });

    it('should not allow to create a review commit for a proposal review that belongs to another reviewer', async () => {
      const [alice] = await driver.users.createReviewer();
      const [bob, { id: bobId }] = await driver.users.createReviewer();

      const { proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        alice,
      );

      driver.actor.setIdentity(bob);
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: `Proposal review with Id ${proposalReviewId} does not belong to user with Id ${bobId}`,
      });
    });

    it('should not allow to create a review commit for a review associated to a completed proposal', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );
      await completeProposal(driver.pic, driver.actor, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });

    it('should not allow a reviewer to create a review commit for the same commit sha', async () => {
      const [reviewer, { id: reviewerId }] =
        await driver.users.createReviewer();

      const { proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
        },
      });
      extractOkResponse(res);

      const resDuplicate = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
        },
      });
      const resDuplicateErr = extractErrResponse(resDuplicate);

      expect(resDuplicateErr).toEqual({
        code: 409,
        message: `User with Id ${reviewerId} has already created a commit review for proposal review with Id ${proposalReviewId} and commit sha ${VALID_COMMIT_SHA_A}`,
      });
    });

    it('should allow a reviewer to create multiple review commits for the same review', async () => {
      const [reviewer, { id: reviewerId }] =
        await driver.users.createReviewer();

      const { proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);
      const createDate = await driver.getCurrentDate();
      const res = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment 1'],
          },
        },
      });
      const resOk = extractOkResponse(res);
      expect(resOk).toEqual({
        id: expect.any(String),
        proposal_review_commit: {
          proposal_review_id: proposalReviewId,
          user_id: reviewerId,
          commit_sha: VALID_COMMIT_SHA_A,
          created_at: dateToRfc3339(createDate),
          last_updated_at: [],
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment 1'],
            },
          },
        },
      });

      const createDate2 = await driver.getCurrentDate();
      const res2 = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_B,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment 2'],
          },
        },
      });
      const resOk2 = extractOkResponse(res2);
      expect(resOk2).toEqual({
        id: expect.any(String),
        proposal_review_commit: {
          proposal_review_id: proposalReviewId,
          user_id: reviewerId,
          commit_sha: VALID_COMMIT_SHA_B,
          created_at: dateToRfc3339(createDate2),
          last_updated_at: [],
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment 2'],
            },
          },
        },
      });
    });

    it('should allow multiple reviewers to create review commits for the same review', async () => {
      const [alice, { id: aliceId }] = await driver.users.createReviewer();
      const [bob, { id: bobId }] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId: aliceProposalReviewId } =
        await createProposalReview(driver.actor, governance, alice);

      driver.actor.setIdentity(alice);
      const aliceCreateDate = await driver.getCurrentDate();
      const resAlice = await driver.actor.create_proposal_review_commit({
        proposal_review_id: aliceProposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment alice'],
          },
        },
      });
      const resAliceOk = extractOkResponse(resAlice);
      expect(resAliceOk).toEqual({
        id: expect.any(String),
        proposal_review_commit: {
          proposal_review_id: aliceProposalReviewId,
          user_id: aliceId,
          commit_sha: VALID_COMMIT_SHA_A,
          created_at: dateToRfc3339(aliceCreateDate),
          last_updated_at: [],
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
            },
          },
        },
      });

      const { proposalReviewId: bobProposalReviewId } =
        await createProposalReview(driver.actor, governance, bob, proposalId);

      driver.actor.setIdentity(bob);
      const bobCreateDate = await driver.getCurrentDate();
      const resBob = await driver.actor.create_proposal_review_commit({
        proposal_review_id: bobProposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment bob'],
          },
        },
      });
      const resBobOk = extractOkResponse(resBob);
      expect(resBobOk).toEqual({
        id: expect.any(String),
        proposal_review_commit: {
          proposal_review_id: bobProposalReviewId,
          user_id: bobId,
          commit_sha: VALID_COMMIT_SHA_A,
          created_at: dateToRfc3339(bobCreateDate),
          last_updated_at: [],
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment bob'],
            },
          },
        },
      });
    });

    it('should not allow a reviewer to create too many review commits', async () => {
      const [reviewer, { id: reviewerId }] =
        await driver.users.createReviewer();

      const { proposalReviewId: proposalReviewId1 } =
        await createProposalReview(driver.actor, governance, reviewer);

      driver.actor.setIdentity(reviewer);
      for (
        let i = 0;
        i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
        i++
      ) {
        const res = await driver.actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId1,
          // generate unique commit sha at each iteration
          commit_sha:
            VALID_COMMIT_SHA_A.slice(0, -2) + i.toString().padStart(2, '0'),
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
            },
          },
        });
        extractOkResponse(res);
      }

      const res1 = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId1,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment alice'],
          },
        },
      });

      const res1Err = extractErrResponse(res1);
      expect(res1Err).toEqual({
        code: 409,
        message: `User with Id ${reviewerId} has already created ${MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER} proposal review commits for proposal review with Id ${proposalReviewId1}`,
      });

      // attempt to reach the limit on another proposal review
      // to test if the reviewer can still create review commits for other proposal reviews
      const { proposalReviewId: proposalReviewId2 } =
        await createProposalReview(driver.actor, governance, reviewer);

      driver.actor.setIdentity(reviewer);
      for (
        let i = 0;
        i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
        i++
      ) {
        const res = await driver.actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId2,
          // generate unique commit sha at each iteration
          commit_sha:
            VALID_COMMIT_SHA_B.slice(0, -2) + i.toString().padStart(2, '0'),
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
            },
          },
        });
        extractOkResponse(res);
      }

      const res2 = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId2,
        commit_sha: VALID_COMMIT_SHA_B,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment alice'],
          },
        },
      });

      const res2Err = extractErrResponse(res2);
      expect(res2Err).toEqual({
        code: 409,
        message: `User with Id ${reviewerId} has already created ${MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER} proposal review commits for proposal review with Id ${proposalReviewId2}`,
      });
    });

    it('should not allow multiple reviewers to create too many review commits', async () => {
      const [alice, { id: aliceId }] = await driver.users.createReviewer();
      const [bob, { id: bobId }] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId: aliceProposalReviewId } =
        await createProposalReview(driver.actor, governance, alice);

      driver.actor.setIdentity(alice);
      for (
        let i = 0;
        i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
        i++
      ) {
        const res = await driver.actor.create_proposal_review_commit({
          proposal_review_id: aliceProposalReviewId,
          // generate unique commit sha at each iteration
          commit_sha:
            VALID_COMMIT_SHA_A.slice(0, -2) + i.toString().padStart(2, '0'),
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
            },
          },
        });
        extractOkResponse(res);
      }

      const resAlice = await driver.actor.create_proposal_review_commit({
        proposal_review_id: aliceProposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment alice'],
          },
        },
      });

      const resAliceErr = extractErrResponse(resAlice);
      expect(resAliceErr).toEqual({
        code: 409,
        message: `User with Id ${aliceId} has already created ${MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER} proposal review commits for proposal review with Id ${aliceProposalReviewId}`,
      });

      const { proposalReviewId: bobProposalReviewId } =
        await createProposalReview(driver.actor, governance, bob, proposalId);

      driver.actor.setIdentity(bob);
      for (
        let i = 0;
        i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
        i++
      ) {
        const res = await driver.actor.create_proposal_review_commit({
          proposal_review_id: bobProposalReviewId,
          // generate unique commit sha at each iteration
          commit_sha:
            VALID_COMMIT_SHA_A.slice(0, -2) + i.toString().padStart(2, '0'),
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment bob'],
            },
          },
        });
        extractOkResponse(res);
      }

      const resBob = await driver.actor.create_proposal_review_commit({
        proposal_review_id: bobProposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment bob'],
          },
        },
      });

      const resBobErr = extractErrResponse(resBob);
      expect(resBobErr).toEqual({
        code: 409,
        message: `User with Id ${bobId} has already created ${MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER} proposal review commits for proposal review with Id ${bobProposalReviewId}`,
      });
    });

    it('should not allow to create an invalid review commit', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalReviewId } = await createProposalReview(
        driver.actor,
        governance,
        reviewer,
      );

      driver.actor.setIdentity(reviewer);

      const resInvalidCommitShaLength =
        await driver.actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A.substring(0, 7),
          state: {
            reviewed: {
              matches_description: [],
              comment: [],
            },
          },
        });
      const resInvalidCommitShaLengthErr = extractErrResponse(
        resInvalidCommitShaLength,
      );
      expect(resInvalidCommitShaLengthErr).toEqual({
        code: 500,
        message: 'Invalid commit sha length: 7',
      });

      const resInvalidCommitShaHex =
        await driver.actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: 'foo bar foo bar foo bar foo bar foo bar ', // valid length, but invalid hex
          state: {
            reviewed: {
              matches_description: [],
              comment: [],
            },
          },
        });
      const resInvalidCommitShaHexErr = extractErrResponse(
        resInvalidCommitShaHex,
      );
      expect(resInvalidCommitShaHexErr.code).toEqual(500);
      expect(
        resInvalidCommitShaHexErr.message.startsWith(
          'Failed to decode commit sha:',
        ),
      ).toBe(true);

      const resEmptyComment = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [],
            comment: [''],
          },
        },
      });
      const resEmptyCommentErr = extractErrResponse(resEmptyComment);
      expect(resEmptyCommentErr).toEqual({
        code: 400,
        message: 'Comment cannot be empty',
      });

      const resLongComment = await driver.actor.create_proposal_review_commit({
        proposal_review_id: proposalReviewId,
        commit_sha: VALID_COMMIT_SHA_A,
        state: {
          reviewed: {
            matches_description: [],
            comment: ['a'.repeat(1001)],
          },
        },
      });
      const resLongCommentErr = extractErrResponse(resLongComment);
      expect(resLongCommentErr).toEqual({
        code: 400,
        message: 'Comment must be less than 1000 characters',
      });
    });
  });

  describe('update proposal review commit', () => {
    it('should not allow anonymous principals', async () => {
      driver.actor.setIdentity(anonymousIdentity);

      const res = await driver.actor.update_proposal_review_commit({
        id: 'proposal-review-commit-id',
        state: {
          reviewed: {
            matches_description: [],
            comment: [],
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
      const [alice] = await driver.users.createAnonymous();
      driver.actor.setIdentity(alice);

      const resAnonymous = await driver.actor.update_proposal_review_commit({
        id: 'proposal-review-commit-id',
        state: {
          reviewed: {
            matches_description: [],
            comment: ['comment'],
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
      driver.actor.setIdentity(controllerIdentity);

      const resAdmin = await driver.actor.update_proposal_review_commit({
        id: 'proposal-review-commit-id',
        state: {
          reviewed: {
            matches_description: [true],
            comment: ['comment'],
          },
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

    it('should allow a reviewer to update a proposal review commit', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalReviewCommitId } = await createProposalReviewCommit(
        driver.actor,
        governance,
        reviewer,
        VALID_COMMIT_SHA_A,
      );

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.update_proposal_review_commit({
        id: proposalReviewCommitId,
        state: {
          reviewed: {
            matches_description: [false],
            comment: ['comment'],
          },
        },
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow a reviewer to update a non-existent proposal review commit', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentProposalReviewCommitId =
        '57bb5dbd-77b4-41c2-abde-1b48a512f420';

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.update_proposal_review_commit({
        id: nonExistentProposalReviewCommitId,
        state: {
          not_reviewed: null,
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review commit with Id ${nonExistentProposalReviewCommitId} not found`,
      });
    });

    it("should not allow a reviewer to update another reviewer's proposal review commit", async () => {
      const [alice] = await driver.users.createReviewer();
      const [bob, { id: bobId }] = await driver.users.createReviewer();

      const { proposalReviewCommitId } = await createProposalReviewCommit(
        driver.actor,
        governance,
        alice,
        VALID_COMMIT_SHA_A,
      );

      driver.actor.setIdentity(bob);
      const res = await driver.actor.update_proposal_review_commit({
        id: proposalReviewCommitId,
        state: {
          reviewed: {
            matches_description: [],
            comment: ['comment'],
          },
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: `Proposal review commit with Id ${proposalReviewCommitId} does not belong to user with Id ${bobId}`,
      });
    });

    it('should not allow a reviewer to update a review commit associated to an already published review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId, proposalReviewCommitId } =
        await createProposalReviewCommit(
          driver.actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );
      await publishProposalReview(driver.actor, reviewer, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.update_proposal_review_commit({
        id: proposalReviewCommitId,
        state: {
          reviewed: {
            matches_description: [],
            comment: ['comment'],
          },
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal review with Id ${proposalReviewId} is already published`,
      });
    });

    it('should not allow a reviewer to update a review commit associated to an already completed proposal', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewCommitId } =
        await createProposalReviewCommit(
          driver.actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );
      await completeProposal(driver.pic, driver.actor, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.update_proposal_review_commit({
        id: proposalReviewCommitId,
        state: {
          reviewed: {
            matches_description: [false],
            comment: ['comment'],
          },
        },
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });

    it('should not allow to update with invalid input', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalReviewCommitId } = await createProposalReviewCommit(
        driver.actor,
        governance,
        reviewer,
        VALID_COMMIT_SHA_A,
      );

      driver.actor.setIdentity(reviewer);

      const resEmptyComment = await driver.actor.update_proposal_review_commit({
        id: proposalReviewCommitId,
        state: {
          reviewed: {
            matches_description: [],
            comment: [''],
          },
        },
      });
      const resEmptyCommentErr = extractErrResponse(resEmptyComment);
      expect(resEmptyCommentErr).toEqual({
        code: 400,
        message: 'Comment cannot be empty',
      });

      const resLongComment = await driver.actor.update_proposal_review_commit({
        id: proposalReviewCommitId,
        state: {
          reviewed: {
            matches_description: [],
            comment: ['a'.repeat(1001)],
          },
        },
      });
      const resLongCommentErr = extractErrResponse(resLongComment);
      expect(resLongCommentErr).toEqual({
        code: 400,
        message: 'Comment must be less than 1000 characters',
      });
    });
  });

  describe('delete proposal review commit', () => {
    it('should not allow anonymous principals', async () => {
      driver.actor.setIdentity(anonymousIdentity);

      const res = await driver.actor.delete_proposal_review_commit({
        id: 'proposal-review-commit-id',
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
      const [alice] = await driver.users.createAnonymous();
      driver.actor.setIdentity(alice);

      const resAnonymous = await driver.actor.delete_proposal_review_commit({
        id: 'proposal-review-commit-id',
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

      const resAdmin = await driver.actor.delete_proposal_review_commit({
        id: 'proposal-review-commit-id',
      });
      const resAdminErr = extractErrResponse(resAdmin);

      expect(resAdminErr).toEqual({
        code: 403,
        message: `Principal ${controllerIdentity
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });
    });

    it('should allow a reviewer to delete a proposal review commit', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalReviewCommitId } = await createProposalReviewCommit(
        driver.actor,
        governance,
        reviewer,
        VALID_COMMIT_SHA_A,
      );

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.delete_proposal_review_commit({
        id: proposalReviewCommitId,
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toBe(null);
    });

    it('should not allow a reviewer to delete a non-existent proposal review commit', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const nonExistentProposalReviewCommitId =
        '57bb5dbd-77b4-41c2-abde-1b48a512f420';

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.delete_proposal_review_commit({
        id: nonExistentProposalReviewCommitId,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal review commit with Id ${nonExistentProposalReviewCommitId} not found`,
      });
    });

    it("should not allow a reviewer to delete another reviewer's proposal review commit", async () => {
      const [alice] = await driver.users.createReviewer();
      const [bob, { id: bobId }] = await driver.users.createReviewer();

      const { proposalReviewCommitId } = await createProposalReviewCommit(
        driver.actor,
        governance,
        alice,
        VALID_COMMIT_SHA_A,
      );

      driver.actor.setIdentity(bob);
      const res = await driver.actor.delete_proposal_review_commit({
        id: proposalReviewCommitId,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: `Proposal review commit with Id ${proposalReviewCommitId} does not belong to user with Id ${bobId}`,
      });
    });

    it('should not allow a reviewer to delete a review commit associated to an already published review', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewId, proposalReviewCommitId } =
        await createProposalReviewCommit(
          driver.actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );
      await publishProposalReview(driver.actor, reviewer, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.delete_proposal_review_commit({
        id: proposalReviewCommitId,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal review with Id ${proposalReviewId} is already published`,
      });
    });

    it('should not allow a reviewer to delete a review commit associated to an already completed proposal', async () => {
      const [reviewer] = await driver.users.createReviewer();

      const { proposalId, proposalReviewCommitId } =
        await createProposalReviewCommit(
          driver.actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );
      await completeProposal(driver.pic, driver.actor, proposalId);

      driver.actor.setIdentity(reviewer);
      const res = await driver.actor.delete_proposal_review_commit({
        id: proposalReviewCommitId,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });
  });
});
