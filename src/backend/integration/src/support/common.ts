import { type _SERVICE } from '@cg/backend';
import { Actor, PocketIc } from '@hadronous/pic';
import { Governance } from './governance';
import { controllerIdentity, nnsProposerIdentity } from './identity';
import { extractOkResponse } from './response';
import { Identity } from '@dfinity/agent';
import { sleep } from './helpers';

type BackendActorService = Actor<_SERVICE>;

/**
 * Creates a user profile and sets the role to reviewer using the {@link controllerIdentity} identity.
 */
export async function createReviewer(
  actor: BackendActorService,
  reviewer: Identity,
): Promise<string> {
  actor.setIdentity(reviewer);
  const reviewerCreateRes = await actor.create_my_user_profile();
  const reviewerCreate = extractOkResponse(reviewerCreateRes);

  actor.setIdentity(controllerIdentity);
  await actor.update_user_profile({
    user_id: reviewerCreate.id,
    username: ['reviewer'],
    config: [
      {
        reviewer: {
          bio: [],
          wallet_address: [],
          neuron_id: [],
          social_links: [],
        },
      },
    ],
  });

  return reviewerCreate.id;
}

/**
 * Creates an RVM proposal and syncs the proposals on the backend canister.
 *
 * Make sure the `title` param is unique, as it is used to find
 * the newly created proposal id in the backend canister.
 *
 * @returns {Promise<string>} the backend canister id of created proposal
 */
export async function createProposal(
  actor: BackendActorService,
  governance: Governance,
  title: string,
): Promise<string> {
  const neuronId = await governance.createNeuron(nnsProposerIdentity);

  // randomize the proposal title to make it unique
  const proposalTitle = title + Math.random().toString();

  await governance.createRvmProposal(nnsProposerIdentity, {
    neuronId: neuronId,
    title: proposalTitle,
    summary: 'Test Proposal Summary',
    replicaVersion: 'ca82a6dff817ec66f44342007202690a93763949',
  });

  actor.setIdentity(controllerIdentity);

  await actor.sync_proposals();
  const res = await actor.list_proposals({
    state: [{ in_progress: null }],
  });
  const { proposals } = extractOkResponse(res);

  const proposal = proposals.find(p => p.proposal.title === proposalTitle);
  if (!proposal) {
    throw new Error(`Could not find proposal with title ${title}`);
  }

  await sleep(100);

  return proposal.id;
}

/**
 * Advances PIC's time in order to make the proposal complete.
 */
export async function completeProposal(
  pic: PocketIc,
  actor: BackendActorService,
  proposalId: string,
) {
  // advance time to make the proposal expire
  await pic.advanceTime(48 * 60 * 60 * 1000); // 48 hours
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
 * Creates an RVM proposal using the {@link createProposal} function
 * and creates a review for that proposal.
 *
 * Skips creating the RVM proposal if a proposal id is specified as last parameter.
 *
 * @returns the backend canister id of created proposal and the backend canister id of created review
 */
export async function createProposalReview(
  actor: BackendActorService,
  governance: Governance,
  reviewer: Identity,
  existingProposalId?: string,
): Promise<{
  proposalId: string;
  proposalReviewId: string;
}> {
  let proposalId = existingProposalId;
  if (!proposalId) {
    // randomize the proposal title to make it unique
    proposalId = await createProposal(
      actor,
      governance,
      'Test proposal ' + Math.random(),
    );
  }

  actor.setIdentity(reviewer);
  const res = await actor.create_proposal_review({
    proposal_id: proposalId,
    summary: ['summary'],
    review_duration_mins: [60],
    build_reproduced: [true],
    reproduced_build_image_id: [],
  });
  const { id: proposalReviewId } = extractOkResponse(res);

  await sleep(100);

  return { proposalId, proposalReviewId };
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
    review_duration_mins: [],
    build_reproduced: [],
    reproduced_build_image_id: [],
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
        highlights: [],
      },
    },
  });
  const { id: proposalReviewCommitId } = extractOkResponse(res);

  await sleep(100);

  return {
    proposalId,
    proposalReviewId,
    proposalReviewCommitId,
  };
}
