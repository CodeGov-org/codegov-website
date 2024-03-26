import { Actor, PocketIc } from '@hadronous/pic';
import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { GovernanceDeclarations } from '@cg/nns-utils';
import { Ledger } from './ledger';
import {
  GOVERNANCE_CANISTER_ID,
  encodeUpdateElectedReplicaVersionsPayload,
  optional,
  generateNonce,
  getNeuronSubaccount,
  bigEndianU64,
  icpToE8s,
} from '@cg/nns-utils';

type GovernanceService = GovernanceDeclarations._SERVICE;
const governanceIdlFactory = GovernanceDeclarations.idlFactory;

export interface CreateRvmProposalRequest {
  neuronId: bigint;
  title: string;
  summary: string;
  replicaVersion: string;
}

export class Governance {
  private readonly ledger: Ledger;
  private readonly actor: Actor<GovernanceService>;
  private readonly defaultIdentity = new AnonymousIdentity();

  constructor(pic: PocketIc) {
    this.actor = pic.createActor<GovernanceService>(
      governanceIdlFactory,
      GOVERNANCE_CANISTER_ID,
    );
    this.ledger = new Ledger(pic);
  }

  public async createNeuron(identity: Identity): Promise<bigint> {
    const nonce = generateNonce();

    const ownerPrincipal = identity.getPrincipal();
    const governanceSubAccount = getNeuronSubaccount(
      ownerPrincipal,
      nonce,
    ).toUint8Array();

    await this.ledger.mint(icpToE8s(100), ownerPrincipal);
    await this.ledger.transfer(
      identity,
      icpToE8s(10),
      GOVERNANCE_CANISTER_ID,
      governanceSubAccount,
      bigEndianU64(nonce),
    );

    try {
      this.actor.setIdentity(identity);

      const claimResponse =
        await this.actor.claim_or_refresh_neuron_from_account({
          controller: [ownerPrincipal],
          memo: nonce,
        });
      const claimResult = claimResponse.result[0];

      if (!claimResult) {
        throw new Error('Failed to create neuron');
      }

      if ('Error' in claimResult) {
        const error = claimResult.Error;
        throw new Error(`${error.error_type}: ${error.error_message}`);
      }

      const neuronId = claimResult.NeuronId;

      const dissolveDelayResponse = await this.actor.manage_neuron({
        id: [neuronId],
        command: [
          {
            Configure: {
              operation: [
                {
                  IncreaseDissolveDelay: {
                    additional_dissolve_delay_seconds:
                      60 * 60 * 24 * 7 * 52 * 1, // 1 year
                  },
                },
              ],
            },
          },
        ],
        neuron_id_or_subaccount: [],
      });
      const dissolveDelayResult = dissolveDelayResponse.command[0];
      if (!dissolveDelayResult) {
        throw new Error('Failed to create proposal');
      }

      if ('Error' in dissolveDelayResult) {
        throw new Error(
          `${dissolveDelayResult.Error.error_type}: ${dissolveDelayResult.Error.error_message}`,
        );
      }

      return neuronId.id;
    } finally {
      this.actor.setIdentity(this.defaultIdentity);
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

    try {
      this.actor.setIdentity(identity);

      const response = await this.actor.manage_neuron({
        id: optional({ id: payload.neuronId }),
        command: [
          {
            MakeProposal: {
              url: '',
              title: optional(payload.title),
              summary: payload.summary,
              action: optional({
                ExecuteNnsFunction: {
                  nns_function: 38,
                  payload: new Uint8Array(rvmPayload),
                },
              }),
            },
          },
        ],
        neuron_id_or_subaccount: [],
      });
      const result = response.command[0];

      if (!result) {
        throw new Error('Failed to create proposal');
      }

      if ('Error' in result) {
        throw new Error(
          `${result.Error.error_type}: ${result.Error.error_message}`,
        );
      }
    } finally {
      this.actor.setIdentity(this.defaultIdentity);
    }
  }
}
