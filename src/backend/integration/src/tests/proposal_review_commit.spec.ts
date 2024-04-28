import { resolve } from 'path';
import { type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  Governance,
  VALID_COMMIT_SHA_A,
  VALID_COMMIT_SHA_B,
  anonymousIdentity,
  completeProposal,
  controllerIdentity,
  createProposalReview,
  createProposalReviewCommit,
  createReviewer,
  dateToRfc3339,
  extractErrResponse,
  extractOkResponse,
  publishProposalReview,
  setupBackendCanister,
  sleep,
} from '../support';

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

const MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER = 50;

describe('Proposal Review Commit', () => {
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

  describe('create proposal review commit', () => {
    describe('batch one', () => {
      it('should not allow anonymous principals', async () => {
        actor.setIdentity(anonymousIdentity);

        const res = await actor.create_proposal_review_commit({
          proposal_review_id: 'proposal-id',
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: [],
              highlights: [],
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

        const resAnonymous = await actor.create_proposal_review_commit({
          proposal_review_id: 'proposal-id',
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: [],
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

        const resAdmin = await actor.create_proposal_review_commit({
          proposal_review_id: 'proposal-id',
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
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
        const reviewer = generateRandomIdentity();
        const reviewerId = await createReviewer(actor, reviewer);

        const { proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );

        actor.setIdentity(reviewer);

        const res = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
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
            created_at: dateToRfc3339(currentDate),
            last_updated_at: [],
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment'],
                highlights: [],
              },
            },
          },
        });
      });

      it('should not allow to create a review commit for a non-existing proposal review', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const nonExistentProposalReviewId =
          '6f4bc04d-e0eb-4a9e-806e-e54b0cb1c270';

        actor.setIdentity(reviewer);
        const res = await actor.create_proposal_review_commit({
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );
        await publishProposalReview(actor, reviewer, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [],
              comment: [],
              highlights: [],
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
        const alice = generateRandomIdentity();
        const bob = generateRandomIdentity();
        await createReviewer(actor, alice);
        const bobId = await createReviewer(actor, bob);

        const { proposalReviewId } = await createProposalReview(
          actor,
          governance,
          alice,
        );

        actor.setIdentity(bob);
        const res = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );
        await completeProposal(pic, actor, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
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
        const reviewer = generateRandomIdentity();
        const reviewerId = await createReviewer(actor, reviewer);

        const { proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );

        actor.setIdentity(reviewer);
        const res = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
            },
          },
        });
        extractOkResponse(res);

        const resDuplicate = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
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
        const reviewer = generateRandomIdentity();
        const reviewerId = await createReviewer(actor, reviewer);

        const { proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );

        actor.setIdentity(reviewer);
        const res = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment 1'],
              highlights: [],
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
            created_at: dateToRfc3339(currentDate),
            last_updated_at: [],
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment 1'],
                highlights: [],
              },
            },
          },
        });

        const res2 = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_B,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment 2'],
              highlights: ['highlight a', 'highlight b'],
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
            created_at: dateToRfc3339(currentDate),
            last_updated_at: [],
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment 2'],
                highlights: ['highlight a', 'highlight b'],
              },
            },
          },
        });
      });
    });

    describe('batch two', () => {
      it('should allow multiple reviewers to create review commits for the same review', async () => {
        const alice = generateRandomIdentity();
        const bob = generateRandomIdentity();
        const aliceId = await createReviewer(actor, alice);
        const bobId = await createReviewer(actor, bob);

        const { proposalId, proposalReviewId: aliceProposalReviewId } =
          await createProposalReview(actor, governance, alice);

        actor.setIdentity(alice);
        const resAlice = await actor.create_proposal_review_commit({
          proposal_review_id: aliceProposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
              highlights: [],
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
            created_at: dateToRfc3339(currentDate),
            last_updated_at: [],
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment alice'],
                highlights: [],
              },
            },
          },
        });

        const { proposalReviewId: bobProposalReviewId } =
          await createProposalReview(actor, governance, bob, proposalId);

        actor.setIdentity(bob);
        const resBob = await actor.create_proposal_review_commit({
          proposal_review_id: bobProposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment bob'],
              highlights: ['highlight bob a', 'highlight bob b'],
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
            created_at: dateToRfc3339(currentDate),
            last_updated_at: [],
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment bob'],
                highlights: ['highlight bob a', 'highlight bob b'],
              },
            },
          },
        });
      });

      it('should not allow a reviewer to create too many review commits', async () => {
        const reviewer = generateRandomIdentity();
        const reviewerId = await createReviewer(actor, reviewer);

        const { proposalReviewId: proposalReviewId1 } =
          await createProposalReview(actor, governance, reviewer);

        actor.setIdentity(reviewer);
        for (
          let i = 0;
          i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
          i++
        ) {
          const res = await actor.create_proposal_review_commit({
            proposal_review_id: proposalReviewId1,
            // generate unique commit sha at each iteration
            commit_sha:
              VALID_COMMIT_SHA_A.slice(0, -2) + i.toString().padStart(2, '0'),
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment alice'],
                highlights: [],
              },
            },
          });
          extractOkResponse(res);
          await sleep(100);
        }

        const res1 = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId1,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
              highlights: [],
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
          await createProposalReview(actor, governance, reviewer);

        actor.setIdentity(reviewer);
        for (
          let i = 0;
          i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
          i++
        ) {
          const res = await actor.create_proposal_review_commit({
            proposal_review_id: proposalReviewId2,
            // generate unique commit sha at each iteration
            commit_sha:
              VALID_COMMIT_SHA_B.slice(0, -2) + i.toString().padStart(2, '0'),
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment alice'],
                highlights: [],
              },
            },
          });
          extractOkResponse(res);
        }

        const res2 = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId2,
          commit_sha: VALID_COMMIT_SHA_B,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
              highlights: [],
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
        const alice = generateRandomIdentity();
        const bob = generateRandomIdentity();
        const aliceId = await createReviewer(actor, alice);
        const bobId = await createReviewer(actor, bob);

        const { proposalId, proposalReviewId: aliceProposalReviewId } =
          await createProposalReview(actor, governance, alice);

        actor.setIdentity(alice);
        for (
          let i = 0;
          i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
          i++
        ) {
          const res = await actor.create_proposal_review_commit({
            proposal_review_id: aliceProposalReviewId,
            // generate unique commit sha at each iteration
            commit_sha:
              VALID_COMMIT_SHA_A.slice(0, -2) + i.toString().padStart(2, '0'),
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment alice'],
                highlights: [],
              },
            },
          });
          extractOkResponse(res);
          await sleep(100);
        }

        const resAlice = await actor.create_proposal_review_commit({
          proposal_review_id: aliceProposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment alice'],
              highlights: [],
            },
          },
        });

        const resAliceErr = extractErrResponse(resAlice);
        expect(resAliceErr).toEqual({
          code: 409,
          message: `User with Id ${aliceId} has already created ${MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER} proposal review commits for proposal review with Id ${aliceProposalReviewId}`,
        });

        const { proposalReviewId: bobProposalReviewId } =
          await createProposalReview(actor, governance, bob, proposalId);

        actor.setIdentity(bob);
        for (
          let i = 0;
          i < MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER;
          i++
        ) {
          const res = await actor.create_proposal_review_commit({
            proposal_review_id: bobProposalReviewId,
            // generate unique commit sha at each iteration
            commit_sha:
              VALID_COMMIT_SHA_A.slice(0, -2) + i.toString().padStart(2, '0'),
            state: {
              reviewed: {
                matches_description: [true],
                comment: ['comment bob'],
                highlights: [],
              },
            },
          });
          extractOkResponse(res);
        }

        const resBob = await actor.create_proposal_review_commit({
          proposal_review_id: bobProposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment bob'],
              highlights: [],
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalReviewId } = await createProposalReview(
          actor,
          governance,
          reviewer,
        );

        actor.setIdentity(reviewer);

        const resInvalidCommitShaLength =
          await actor.create_proposal_review_commit({
            proposal_review_id: proposalReviewId,
            commit_sha: VALID_COMMIT_SHA_A.substring(0, 7),
            state: {
              reviewed: {
                matches_description: [],
                comment: [],
                highlights: [],
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
          await actor.create_proposal_review_commit({
            proposal_review_id: proposalReviewId,
            commit_sha: 'foo bar foo bar foo bar foo bar foo bar ', // valid length, but invalid hex
            state: {
              reviewed: {
                matches_description: [],
                comment: [],
                highlights: [],
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

        const resEmptyComment = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [],
              comment: [''],
              highlights: [],
            },
          },
        });
        const resEmptyCommentErr = extractErrResponse(resEmptyComment);
        expect(resEmptyCommentErr).toEqual({
          code: 400,
          message: 'Comment cannot be empty',
        });

        const resLongComment = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['a'.repeat(1001)],
              highlights: [],
            },
          },
        });
        const resLongCommentErr = extractErrResponse(resLongComment);
        expect(resLongCommentErr).toEqual({
          code: 400,
          message: 'Comment must be less than 1000 characters',
        });

        const resTooManyHighlights = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: Array(6).fill('highlight'),
            },
          },
        });
        const resTooManyHighlightsErr =
          extractErrResponse(resTooManyHighlights);
        expect(resTooManyHighlightsErr).toEqual({
          code: 400,
          message: 'Number of highlights must be less than 5',
        });

        const resEmptyHighlight = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: ['valid highlight', ''],
            },
          },
        });
        const resEmptyHighlightErr = extractErrResponse(resEmptyHighlight);
        expect(resEmptyHighlightErr).toEqual({
          code: 400,
          message: 'Highlight cannot be empty',
        });

        const resLongHighlight = await actor.create_proposal_review_commit({
          proposal_review_id: proposalReviewId,
          commit_sha: VALID_COMMIT_SHA_A,
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: ['a'.repeat(101), 'valid highlight'],
            },
          },
        });
        const resLongHighlightErr = extractErrResponse(resLongHighlight);
        expect(resLongHighlightErr).toEqual({
          code: 400,
          message: 'Each highlight must be less than 100 characters',
        });
      });
    });
  });

  describe('update proposal review commit', () => {
    describe('batch one', () => {
      it('should not allow anonymous principals', async () => {
        actor.setIdentity(anonymousIdentity);

        const res = await actor.update_proposal_review_commit({
          id: 'proposal-review-commit-id',
          state: {
            reviewed: {
              matches_description: [],
              comment: [],
              highlights: [],
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

        const resAnonymous = await actor.update_proposal_review_commit({
          id: 'proposal-review-commit-id',
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: [],
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

        const resAdmin = await actor.update_proposal_review_commit({
          id: 'proposal-review-commit-id',
          state: {
            reviewed: {
              matches_description: [true],
              comment: ['comment'],
              highlights: [],
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalReviewCommitId } = await createProposalReviewCommit(
          actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );

        actor.setIdentity(reviewer);
        const res = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [false],
              comment: ['comment'],
              highlights: ['highlight a', 'highlight b'],
            },
          },
        });
        const resOk = extractOkResponse(res);

        expect(resOk).toBe(null);
      });

      it('should not allow a reviewer to update a non-existent proposal review commit', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const nonExistentProposalReviewCommitId =
          '57bb5dbd-77b4-41c2-abde-1b48a512f420';

        actor.setIdentity(reviewer);
        const res = await actor.update_proposal_review_commit({
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
    });

    describe('batch two', () => {
      it("should not allow a reviewer to update another reviewer's proposal review commit", async () => {
        const alice = generateRandomIdentity();
        const bob = generateRandomIdentity();
        await createReviewer(actor, alice);
        const bobId = await createReviewer(actor, bob);

        const { proposalReviewCommitId } = await createProposalReviewCommit(
          actor,
          governance,
          alice,
          VALID_COMMIT_SHA_A,
        );

        actor.setIdentity(bob);
        const res = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: ['highlight a', 'highlight b'],
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewId, proposalReviewCommitId } =
          await createProposalReviewCommit(
            actor,
            governance,
            reviewer,
            VALID_COMMIT_SHA_A,
          );
        await publishProposalReview(actor, reviewer, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: ['highlight a', 'highlight b'],
            },
          },
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 409,
          message: `Proposal review with Id ${proposalReviewId} is already published`,
        });
      });
    });

    describe('batch three', () => {
      it('should not allow a reviewer to update a review commit associated to an already completed proposal', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewCommitId } =
          await createProposalReviewCommit(
            actor,
            governance,
            reviewer,
            VALID_COMMIT_SHA_A,
          );
        await completeProposal(pic, actor, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [false],
              comment: ['comment'],
              highlights: ['highlight a', 'highlight b'],
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalReviewCommitId } = await createProposalReviewCommit(
          actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );

        actor.setIdentity(reviewer);

        const resEmptyComment = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: [''],
              highlights: [],
            },
          },
        });
        const resEmptyCommentErr = extractErrResponse(resEmptyComment);
        expect(resEmptyCommentErr).toEqual({
          code: 400,
          message: 'Comment cannot be empty',
        });
        await sleep(100);

        const resLongComment = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['a'.repeat(1001)],
              highlights: [],
            },
          },
        });
        const resLongCommentErr = extractErrResponse(resLongComment);
        expect(resLongCommentErr).toEqual({
          code: 400,
          message: 'Comment must be less than 1000 characters',
        });
        await sleep(100);

        const resTooManyHighlights = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: Array(6).fill('highlight'),
            },
          },
        });
        const resTooManyHighlightsErr =
          extractErrResponse(resTooManyHighlights);
        expect(resTooManyHighlightsErr).toEqual({
          code: 400,
          message: 'Number of highlights must be less than 5',
        });
        await sleep(100);

        const resEmptyHighlight = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: ['valid highlight', ''],
            },
          },
        });
        const resEmptyHighlightErr = extractErrResponse(resEmptyHighlight);
        expect(resEmptyHighlightErr).toEqual({
          code: 400,
          message: 'Highlight cannot be empty',
        });
        await sleep(100);

        const resLongHighlight = await actor.update_proposal_review_commit({
          id: proposalReviewCommitId,
          state: {
            reviewed: {
              matches_description: [],
              comment: ['comment'],
              highlights: ['a'.repeat(101), 'valid highlight'],
            },
          },
        });
        const resLongHighlightErr = extractErrResponse(resLongHighlight);
        expect(resLongHighlightErr).toEqual({
          code: 400,
          message: 'Each highlight must be less than 100 characters',
        });
      });
    });
  });

  describe('delete proposal review commit', () => {
    describe('batch one', () => {
      it('should not allow anonymous principals', async () => {
        actor.setIdentity(anonymousIdentity);

        const res = await actor.delete_proposal_review_commit({
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
        const alice = generateRandomIdentity();
        actor.setIdentity(alice);

        await actor.create_my_user_profile();

        const resAnonymous = await actor.delete_proposal_review_commit({
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
        actor.setIdentity(controllerIdentity);

        const resAdmin = await actor.delete_proposal_review_commit({
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
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalReviewCommitId } = await createProposalReviewCommit(
          actor,
          governance,
          reviewer,
          VALID_COMMIT_SHA_A,
        );

        actor.setIdentity(reviewer);
        const res = await actor.delete_proposal_review_commit({
          id: proposalReviewCommitId,
        });
        const resOk = extractOkResponse(res);

        expect(resOk).toBe(null);
      });

      it('should not allow a reviewer to delete a non-existent proposal review commit', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const nonExistentProposalReviewCommitId =
          '57bb5dbd-77b4-41c2-abde-1b48a512f420';

        actor.setIdentity(reviewer);
        const res = await actor.delete_proposal_review_commit({
          id: nonExistentProposalReviewCommitId,
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 404,
          message: `Proposal review commit with Id ${nonExistentProposalReviewCommitId} not found`,
        });

        expect(false).toBe(true);
      });
    });

    describe('batch two', () => {
      it("should not allow a reviewer to delete another reviewer's proposal review commit", async () => {
        const alice = generateRandomIdentity();
        const bob = generateRandomIdentity();
        await createReviewer(actor, alice);
        const bobId = await createReviewer(actor, bob);

        const { proposalReviewCommitId } = await createProposalReviewCommit(
          actor,
          governance,
          alice,
          VALID_COMMIT_SHA_A,
        );

        actor.setIdentity(bob);
        const res = await actor.delete_proposal_review_commit({
          id: proposalReviewCommitId,
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 403,
          message: `Proposal review commit with Id ${proposalReviewCommitId} does not belong to user with Id ${bobId}`,
        });
      });

      it('should not allow a reviewer to delete a review commit associated to an already published review', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewId, proposalReviewCommitId } =
          await createProposalReviewCommit(
            actor,
            governance,
            reviewer,
            VALID_COMMIT_SHA_A,
          );
        await publishProposalReview(actor, reviewer, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.delete_proposal_review_commit({
          id: proposalReviewCommitId,
        });
        const resErr = extractErrResponse(res);

        expect(resErr).toEqual({
          code: 409,
          message: `Proposal review with Id ${proposalReviewId} is already published`,
        });
      });

      it('should not allow a reviewer to delete a review commit associated to an already completed proposal', async () => {
        const reviewer = generateRandomIdentity();
        await createReviewer(actor, reviewer);

        const { proposalId, proposalReviewCommitId } =
          await createProposalReviewCommit(
            actor,
            governance,
            reviewer,
            VALID_COMMIT_SHA_A,
          );
        await completeProposal(pic, actor, proposalId);

        actor.setIdentity(reviewer);
        const res = await actor.delete_proposal_review_commit({
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
});
