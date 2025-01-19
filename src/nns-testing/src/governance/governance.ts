import {
  Actor,
  ActorSubclass,
  AnonymousIdentity,
  HttpAgent,
  Identity,
} from '@dfinity/agent';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import {
  GovernanceCanister,
  MakeProposalRequest,
  GovernanceError,
} from '@dfinity/nns';
import { isNullish } from '@dfinity/utils';
import { isNil } from '@cg/utils';

import { Ledger } from '../icp-ledger';
import { CreateAgentOptions, createAgent } from '../agent';
import {
  GOVERNANCE_CANISTER_ID,
  encodeUpdateElectedReplicaVersionsPayload,
  generateNonce,
  getNeuronSubaccount,
  optional,
  GovernanceDeclarations,
} from '@cg/nns-utils';
import {
  CreateIcOsVersionElectionProposalRequest,
  SyncMainnetProposalRequest,
} from './types';
import { Ora } from 'ora';

export class Governance {
  readonly #governanceCanister: GovernanceCanister;
  readonly #defaultIdentity = new AnonymousIdentity();

  readonly #mainnetGovernanceActor: ActorSubclass<GovernanceDeclarations._SERVICE>;

  private constructor(
    private readonly agent: HttpAgent,
    mainnetAgent: HttpAgent,
    private readonly ledger: Ledger,
  ) {
    agent.replaceIdentity(this.#defaultIdentity);
    mainnetAgent.replaceIdentity(this.#defaultIdentity);

    this.#mainnetGovernanceActor = Actor.createActor(
      GovernanceDeclarations.idlFactory,
      {
        canisterId: GOVERNANCE_CANISTER_ID,
        agent: mainnetAgent,
      },
    );

    this.#governanceCanister = GovernanceCanister.create({
      agent,
      canisterId: GOVERNANCE_CANISTER_ID,
    });
  }

  public static async create(
    agentOptions: CreateAgentOptions,
  ): Promise<Governance> {
    const agent = await createAgent(agentOptions);
    const mainnetAgent = new HttpAgent({
      ...agentOptions,
      host: 'https://icp-api.io',
    });
    const ledger = await Ledger.create(agentOptions);

    return new Governance(agent, mainnetAgent, ledger);
  }

  public async createNeuron(identity: Identity, spinner: Ora): Promise<bigint> {
    const nonce = generateNonce();

    const ownerPrincipal = identity.getPrincipal();
    const ownerAccount = AccountIdentifier.fromPrincipal({
      principal: ownerPrincipal,
    });

    const governanceSubAccount = getNeuronSubaccount(ownerPrincipal, nonce);

    const targetGovernanceAccount = AccountIdentifier.fromPrincipal({
      principal: GOVERNANCE_CANISTER_ID,
      subAccount: governanceSubAccount,
    });

    spinner.text = 'Minting ICP...';
    await this.ledger.mint(100, ownerAccount);

    spinner.text = 'Transferring ICP to governance account...';
    await this.ledger.transfer(identity, 10, targetGovernanceAccount, nonce);

    try {
      this.agent.replaceIdentity(identity);

      spinner.text = 'Creating neuron...';
      const neuronId =
        await this.#governanceCanister.claimOrRefreshNeuronFromAccount({
          controller: ownerPrincipal,
          memo: nonce,
        });

      if (isNullish(neuronId)) {
        throw new Error('Failed to create neuron');
      }

      spinner.text = 'Increasing dissolve delay...';
      await this.#governanceCanister.increaseDissolveDelay({
        neuronId,
        additionalDissolveDelaySeconds: 60 * 60 * 24 * 7 * 52 * 1, // 1 year
      });

      return neuronId;
    } catch (error) {
      if (error instanceof GovernanceError) {
        throw error.detail;
      }

      throw error;
    } finally {
      this.agent.replaceIdentity(this.#defaultIdentity);
    }
  }

  public async createIcOsVersionElectionProposal(
    identity: Identity,
    payload: CreateIcOsVersionElectionProposalRequest,
  ): Promise<void> {
    const payloadBytes = encodeUpdateElectedReplicaVersionsPayload({
      release_package_urls: [
        `https://download.dfinity.systems/ic/${payload.replicaVersion}/guest-os/update-img/update-img.tar.gz`,
        `https://download.dfinity.network/ic/${payload.replicaVersion}/guest-os/update-img/update-img.tar.gz`,
      ],
      replica_version_to_elect: optional(payload.replicaVersion),
      guest_launch_measurement_sha256_hex: [],
      release_package_sha256_hex: [],
      replica_versions_to_unelect: [],
    });

    return await this.makeProposal(identity, {
      neuronId: payload.neuronId,
      summary: payload.summary,
      title: payload.title,
      url: '',
      action: {
        ExecuteNnsFunction: {
          nnsFunctionId: 38,
          payloadBytes,
        },
      },
    });
  }

  public async syncMainnetProposal(
    identity: Identity,
    payload: SyncMainnetProposalRequest,
    spinner: Ora,
  ): Promise<void> {
    const { neuronId, proposalId } = payload;

    spinner.text = `Fetching proposal with ID ${proposalId} from mainnet...`;
    const [proposalInfo] =
      await this.#mainnetGovernanceActor.get_proposal_info(proposalId);
    if (isNil(proposalInfo)) {
      throw new Error(`Proposal with ID ${proposalId} not found on mainnet.`);
    }

    const [proposal] = proposalInfo.proposal;
    if (isNil(proposal)) {
      throw new Error(
        `Proposal with ID ${proposalId} was found on mainnet but has no payload.`,
      );
    }

    const [action] = proposal.action;
    if (isNil(action)) {
      throw new Error(
        `Proposal with ID ${proposalId} was found on mainnet but has no action.`,
      );
    }

    const [title] = proposal.title;
    if ('ExecuteNnsFunction' in action) {
      return await this.makeProposal(identity, {
        action: {
          ExecuteNnsFunction: {
            nnsFunctionId: action.ExecuteNnsFunction.nns_function,
            payloadBytes:
              action.ExecuteNnsFunction.payload instanceof Uint8Array
                ? (action.ExecuteNnsFunction.payload.buffer as ArrayBuffer)
                : new Uint8Array(action.ExecuteNnsFunction.payload).buffer,
          },
        },
        neuronId,
        summary: proposal.summary,
        title,
        url: proposal.url,
      });
    }

    throw new Error(
      'Only proposals that use the `ExecuteNnsFunction` action can be synced.',
    );
  }

  private async makeProposal(
    identity: Identity,
    req: MakeProposalRequest,
  ): Promise<void> {
    try {
      this.agent.replaceIdentity(identity);
      await this.#governanceCanister.makeProposal(req);
    } catch (error) {
      if (error instanceof GovernanceError) {
        throw error.detail;
      }

      throw error;
    } finally {
      this.agent.replaceIdentity(this.#defaultIdentity);
    }
  }
}
