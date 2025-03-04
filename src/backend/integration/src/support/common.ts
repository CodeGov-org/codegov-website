import { expect } from 'bun:test';
import {
  ProposalReviewCommitWithId,
  ProposalReviewStatus,
  ProposalReviewWithId,
  ProposalVote,
  type _SERVICE,
} from '@cg/backend';
import { Actor, PocketIc } from '@hadronous/pic';
import { Governance } from './governance';
import { controllerIdentity, nnsProposerIdentity } from './identity';
import { extractOkResponse } from './response';
import { Identity } from '@dfinity/agent';

type BackendActorService = Actor<_SERVICE>;

/**
 * Creates an IcOsVersionElection proposal and syncs the proposals on the backend canister.
 *
 * @returns {Promise<string>} the backend canister id of created proposal
 */
export async function createProposal(
  actor: BackendActorService,
  governance: Governance,
  title: string,
): Promise<{
  nnsProposalId: bigint;
  proposalId: string;
}> {
  const neuronId = await governance.createNeuron(nnsProposerIdentity);

  const proposalId = await governance.createIcOsVersionElectionProposal(
    nnsProposerIdentity,
    {
      neuronId,
      title,
      summary: 'Test Proposal Summary',
      replicaVersion: 'ca82a6dff817ec66f44342007202690a93763949',
    },
  );

  actor.setIdentity(controllerIdentity);

  await actor.sync_proposals();
  const res = await actor.list_proposals({
    state: [{ in_progress: null }],
  });
  const { proposals } = extractOkResponse(res);

  const proposal = proposals.find(
    p =>
      p.proposal.nervous_system.network.proposal_info.id[0]!.id === proposalId,
  );
  if (!proposal) {
    throw new Error(`Could not find proposal with id ${proposalId.toString()}`);
  }

  return {
    nnsProposalId: proposalId,
    proposalId: proposal.id,
  };
}

/**
 * The review period is **48 hours** in milliseconds.
 */
export const REVIEW_PERIOD_MS = 48 * 60 * 60 * 1000;

/**
 * Advances PIC's time in order to make the proposal complete.
 */
export async function completeProposal(
  pic: PocketIc,
  actor: BackendActorService,
  proposalId: string,
) {
  // advance time to make the proposal expire
  await pic.advanceTime(REVIEW_PERIOD_MS);
  // ensure timers run
  await pic.tick(2);

  const res = await actor.list_proposals({
    state: [{ completed: null }],
  });
  const { proposals } = extractOkResponse(res);

  const completedProposal = proposals.find(p => p.id === proposalId);
  if (!completedProposal) {
    throw new Error(`Could not find proposal with id ${proposalId}`);
  }
}

/**
 * Creates an IcOsVersionElection proposal using the {@link createProposal} function
 * and creates a review for that proposal.
 *
 * Skips creating the IcOsVersionElection proposal if a proposal id is specified as last parameter.
 *
 * @returns the backend canister id of created proposal and the backend canister id of created review
 */
export async function createProposalReview(
  actor: BackendActorService,
  governance: Governance,
  reviewer: Identity,
  existingProposalId?: string,
): Promise<{
  nnsProposalId?: bigint;
  proposalId: string;
  proposalReviewId: string;
}> {
  let proposalId = existingProposalId;
  let nnsProposalId: bigint | undefined;
  if (!proposalId) {
    // randomize the proposal title to make it unique
    const res = await createProposal(
      actor,
      governance,
      'Test proposal ' + Math.random(),
    );

    proposalId = res.proposalId;
    nnsProposalId = res.nnsProposalId;
  }

  actor.setIdentity(reviewer);
  const res = await actor.create_proposal_review({
    proposal_id: proposalId,
    summary: ['summary'],
    build_reproduced: [true],
    vote: [{ yes: null }],
  });
  const { id: proposalReviewId } = extractOkResponse(res);

  return { nnsProposalId, proposalId, proposalReviewId };
}

/**
 * This is not a real image, but passes the checks on the canister.
 */
export const VALID_IMAGE_BYTES = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

/**
 * Same as {@link createProposalReview} function,
 * but uploads the provided image too.
 *
 * Skips creating the IcOsVersionElection proposal if a proposal id is specified as last parameter.
 *
 * @returns the backend canister id of created proposal, the backend canister id of created review
 * and the image path.
 */
export async function createProposalReviewWithImage(
  actor: BackendActorService,
  governance: Governance,
  reviewer: Identity,
  imageBytes: Uint8Array,
  existingProposalId?: string,
): Promise<{
  proposalId: string;
  proposalReviewId: string;
  imagePath: string;
}> {
  const { proposalId, proposalReviewId } = await createProposalReview(
    actor,
    governance,
    reviewer,
    existingProposalId,
  );

  actor.setIdentity(reviewer);
  const res = await actor.create_proposal_review_image({
    proposal_id: proposalId,
    content_type: 'image/png',
    content_bytes: imageBytes,
  });
  const resOk = extractOkResponse(res);

  const imagePath = resOk.path;

  return { proposalId, proposalReviewId, imagePath };
}

/**
 * Publishes the proposal review associated to the given proposal id and reviewer identity.
 */
export async function publishProposalReview(
  actor: BackendActorService,
  reviewer: Identity,
  proposalId: string,
) {
  actor.setIdentity(reviewer);
  const res = await actor.update_proposal_review({
    proposal_id: proposalId,
    status: [{ published: null }],
    summary: [],
    build_reproduced: [],
    vote: [],
  });
  extractOkResponse(res);
}

export const VALID_COMMIT_SHA_A = '47d98477c6c59e570e2220aab433b0943b326ef8';
export const VALID_COMMIT_SHA_B = 'f8f6b901032c59f4d60c8ad90c74042859bcc42e';

/**
 * Creates a new proposal review commit with the given commit sha.
 * Uses the {@link createProposalReview} function to create the proposal review.
 *
 * @returns the backend canister id of the created proposal,
 * the id of the created review and the id of the created proposal review commit
 */
export async function createProposalReviewCommit(
  actor: BackendActorService,
  governance: Governance,
  reviewer: Identity,
  commitSha: string,
  existingProposalReviewData?: {
    nnsProposalId?: bigint;
    proposalId: string;
    proposalReviewId: string;
  },
): Promise<{
  proposalId: string;
  proposalReviewId: string;
  proposalReviewCommitId: string;
}> {
  let proposalId: string;
  let proposalReviewId: string;
  if (!existingProposalReviewData) {
    const result = await createProposalReview(actor, governance, reviewer);
    proposalId = result.proposalId;
    proposalReviewId = result.proposalReviewId;
  } else {
    proposalId = existingProposalReviewData.proposalId;
    proposalReviewId = existingProposalReviewData.proposalReviewId;
  }

  actor.setIdentity(reviewer);
  const res = await actor.create_proposal_review_commit({
    proposal_review_id: proposalReviewId,
    commit_sha: commitSha,
    state: {
      reviewed: {
        matches_description: [true],
        comment: ['comment'],
      },
    },
  });
  const { id: proposalReviewCommitId } = extractOkResponse(res);

  return {
    proposalId,
    proposalReviewId,
    proposalReviewCommitId,
  };
}

export type ExpectedProposalReviewFields = {
  proposalId: string;
  userId: string;
  reviewStatus: ProposalReviewStatus;
  lastUpdatedAt?: string;
  commits: {
    commitSha: string[];
  };
  vote: ProposalVote;
};

export function validateProposalReview(
  proposalReview: ProposalReviewWithId,
  expected: ExpectedProposalReviewFields,
) {
  expect(proposalReview).toEqual({
    id: expect.any(String),
    proposal_review: {
      proposal_id: expected.proposalId,
      user_id: expected.userId,
      status: expected.reviewStatus,
      created_at: expect.any(String),
      last_updated_at: expected.lastUpdatedAt ? [expected.lastUpdatedAt] : [],
      summary: expect.any(Array),
      build_reproduced: expect.any(Array),
      images_paths: expect.any(Array),
      vote: expected.vote,
      proposal_review_commits: expected.commits.commitSha.map(
        commitSha =>
          ({
            id: expect.any(String),
            proposal_review_commit: {
              commit_sha: commitSha,
              user_id: expected.userId,
              proposal_review_id: expect.any(String),
              created_at: expect.any(String),
              last_updated_at: [],
              state: expect.anything(),
            },
          }) satisfies ProposalReviewCommitWithId,
      ),
    },
  } satisfies ProposalReviewWithId);
}
