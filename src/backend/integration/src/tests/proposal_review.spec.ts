import { resolve } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { type _SERVICE } from '@cg/backend';
import { PocketIc, type Actor, generateRandomIdentity } from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  anonymousIdentity,
  controllerIdentity,
  extractErrResponse,
  extractOkResponse,
  setupBackendCanister,
  Governance,
  nnsProposerIdentity,
  dateToRfc3339,
} from '../support';
import { Identity } from '@dfinity/agent';

const NNS_SUBNET_ID =
  '2o3zy-oo4hc-r3mtq-ylrpf-g6qge-qmuzn-2bsuv-d3yhd-e4qjc-6ff2b-6ae';

const NNS_STATE_PATH = resolve(
  import.meta.dir,
  '..',
  '..',
  'state',
  'proposal_reviews_nns_state',
  'node-100',
  'state',
);

type BackendActorService = Actor<_SERVICE>;

describe('Proposal Review', () => {
  let actor: BackendActorService;
  let pic: PocketIc;
  // set to any date after the NNS state has been generated
  const currentDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  beforeEach(async () => {
    pic = await PocketIc.create({
      nns: {
        fromPath: NNS_STATE_PATH,
        subnetId: Principal.fromText(NNS_SUBNET_ID),
      },
    });
    const fixture = await setupBackendCanister(pic, currentDate);
    actor = fixture.actor;
    console.log('canisterId', fixture.canisterId.toText());

    governance = new Governance(pic);
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  describe('create proposal review', () => {
    it('should not allow anonymous principals', async () => {
      actor.setIdentity(anonymousIdentity);

      const res = await actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: 'summary',
        review_duration_mins: 60,
        build_reproduced: true,
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

      let res = await actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: 'summary',
        review_duration_mins: 60,
        build_reproduced: true,
      });
      let resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: `Principal ${alice
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });

      // as admin
      actor.setIdentity(controllerIdentity);

      res = await actor.create_proposal_review({
        proposal_id: 'proposal-id',
        summary: 'summary',
        review_duration_mins: 60,
        build_reproduced: true,
      });
      resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 403,
        message: `Principal ${controllerIdentity
          .getPrincipal()
          .toText()} must be a reviewer to call this endpoint`,
      });
    });

    it('should allow reviewers to create a proposal review', async () => {
      const reviewer = generateRandomIdentity();
      const reviewerId = await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);

      actor.setIdentity(reviewer);
      const res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: 'summary',
        review_duration_mins: 60,
        build_reproduced: true,
      });
      const resOk = extractOkResponse(res);

      expect(resOk).toEqual({
        id: expect.any(String),
        proposal_review: {
          proposal_id: proposalId,
          user_id: reviewerId,
          status: { draft: null },
          created_at: dateToRfc3339(currentDate),
          summary: 'summary',
          review_duration_mins: 60,
          build_reproduced: true,
          reproduced_build_image_id: [],
        },
      });
    });

    it('should not allow to create a review for a proposal that does not exist', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const nonExistentProposalId = 'c61d2984-16c6-4918-9e8b-ed8ee1b05680';

      actor.setIdentity(reviewer);
      const res = await actor.create_proposal_review({
        proposal_id: nonExistentProposalId,
        summary: 'summary',
        review_duration_mins: 60,
        build_reproduced: true,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 404,
        message: `Proposal with Id ${nonExistentProposalId} not found`,
      });
    });

    it('should not allow to create a review for a proposal that is completed', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createCompletedProposal(pic, actor, governance);

      actor.setIdentity(reviewer);
      const res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: 'summary',
        review_duration_mins: 60,
        build_reproduced: true,
      });
      const resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 409,
        message: `Proposal with Id ${proposalId} is already completed`,
      });
    });

    it('should not allow to create an invalid review', async () => {
      const reviewer = generateRandomIdentity();
      await createReviewer(actor, reviewer);

      const proposalId = await createProposal(actor, governance);

      actor.setIdentity(reviewer);

      // empty summary
      let res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: '',
        review_duration_mins: 60,
        build_reproduced: true,
      });
      let resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 400,
        message: 'Summary cannot be empty',
      });

      // too long summary
      res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: 'a'.repeat(1501),
        review_duration_mins: 60,
        build_reproduced: true,
      });
      resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 400,
        message: 'Summary must be less than 1500 characters',
      });

      // zero duration
      res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: 'summary',
        review_duration_mins: 0,
        build_reproduced: true,
      });
      resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 400,
        message: 'Review duration cannot be 0',
      });

      // too long duration
      res = await actor.create_proposal_review({
        proposal_id: proposalId,
        summary: 'summary',
        review_duration_mins: 3 * 60 + 1,
        build_reproduced: true,
      });
      resErr = extractErrResponse(res);

      expect(resErr).toEqual({
        code: 400,
        message: 'Review duration must be less than 180 minutes',
      });
    });
  });
});

async function createReviewer(
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
async function createProposal(
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

async function createCompletedProposal(
  pic: PocketIc,
  actor: BackendActorService,
  governance: Governance,
): Promise<string> {
  const proposalId = await createProposal(actor, governance);

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

  return completedProposal.id;
}
