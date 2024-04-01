import { AnonymousIdentity, HttpAgent, Identity } from '@dfinity/agent';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import {
  GovernanceCanister,
  MakeProposalRequest,
  GovernanceError,
} from '@dfinity/nns';
import { isNullish } from '@dfinity/utils';

import { Ledger } from '../icp-ledger';
import { CreateAgentOptions, createAgent } from '../agent';
import {
  GOVERNANCE_CANISTER_ID,
  encodeUpdateElectedReplicaVersionsPayload,
  generateNonce,
  getNeuronSubaccount,
  optional,
} from '@cg/nns-utils';
import { CreateRvmProposalRequest } from './types';
import { Ora } from 'ora';

export class Governance {
  private readonly governanceCanister: GovernanceCanister;
  private readonly defaultIdentity = new AnonymousIdentity();

  private constructor(
    private readonly agent: HttpAgent,
    private readonly ledger: Ledger,
  ) {
    agent.replaceIdentity(this.defaultIdentity);

    this.governanceCanister = GovernanceCanister.create({
      agent,
      canisterId: GOVERNANCE_CANISTER_ID,
    });
  }

  public static async create(
    agentOptions: CreateAgentOptions,
  ): Promise<Governance> {
    const agent = await createAgent(agentOptions);
    const ledger = await Ledger.create(agentOptions);

    return new Governance(agent, ledger);
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
        await this.governanceCanister.claimOrRefreshNeuronFromAccount({
          controller: ownerPrincipal,
          memo: nonce,
        });

      if (isNullish(neuronId)) {
        throw new Error('Failed to create neuron');
      }

      spinner.text = 'Increasing dissolve delay...';
      await this.governanceCanister.increaseDissolveDelay({
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
      this.agent.replaceIdentity(this.defaultIdentity);
    }
  }

  public async createRvmProposal(
    identity: Identity,
    payload: CreateRvmProposalRequest,
  ): Promise<void> {
    const rvmPayload = encodeUpdateElectedReplicaVersionsPayload({
      release_package_urls: [
        `https://download.dfinity.systems/ic/${payload.replicaVersion}/guest-os/update-img/update-img.tar.gz`,
        `https://download.dfinity.network/ic/${payload.replicaVersion}/guest-os/update-img/update-img.tar.gz`,
      ],
      replica_version_to_elect: optional(payload.replicaVersion),
      guest_launch_measurement_sha256_hex: [],
      release_package_sha256_hex: [],
      replica_versions_to_unelect: [],
    });

    const args: MakeProposalRequest = {
      neuronId: payload.neuronId,
      summary: payload.summary,
      title: payload.title,
      url: '',
      action: {
        ExecuteNnsFunction: {
          nnsFunctionId: 38,
          payloadBytes: rvmPayload,
        },
      },
    };

    try {
      this.agent.replaceIdentity(identity);
      await this.governanceCanister.makeProposal(args);
    } catch (error) {
      if (error instanceof GovernanceError) {
        throw error.detail;
      }

      throw error;
    } finally {
      this.agent.replaceIdentity(this.defaultIdentity);
    }
  }
}
