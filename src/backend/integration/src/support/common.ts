import { type _SERVICE } from '@cg/backend';
import { Actor, PocketIc } from '@hadronous/pic';
import { Governance } from './governance';
import { controllerIdentity, nnsProposerIdentity } from './identity';
import { extractOkResponse } from './response';
import { Identity } from '@dfinity/agent';

type BackendActorService = Actor<_SERVICE>;

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
 * Creates an RVM proposal, syncs the proposals on the backend canister
 * and returns the backend proposal id.
 */
export async function createProposal(
  actor: BackendActorService,
  governance: Governance,
): Promise<string> {
  const neuronId = await governance.createNeuron(nnsProposerIdentity);

  await governance.createRvmProposal(nnsProposerIdentity, {
    neuronId: neuronId,
    title: 'Test Proposal',
    summary: 'Test Proposal Summary',
    replicaVersion: 'ca82a6dff817ec66f44342007202690a93763949',
  });

  actor.setIdentity(controllerIdentity);

  await actor.sync_proposals();
  const res = await actor.list_proposals({
    state: [{ in_progress: null }],
  });
  const { proposals } = extractOkResponse(res);

  return proposals[0].id;
}

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

  const completedProposal = proposals[0];
  if (completedProposal.id !== proposalId) {
    throw new Error(
      `Expected proposal id ${proposalId} but got ${completedProposal.id}`,
    );
  }
}

export async function createProposalReview(
  actor: BackendActorService,
  governance: Governance,
  reviewer: Identity,
): Promise<[string, string]> {
  const proposalId = await createProposal(actor, governance);

  actor.setIdentity(reviewer);
  const res = await actor.create_proposal_review({
    proposal_id: proposalId,
    summary: ['summary'],
    review_duration_mins: [60],
    build_reproduced: [true],
    reproduced_build_image_id: [],
  });
  const { id } = extractOkResponse(res);

  return [proposalId, id];
}
