import { AnonymousIdentity, HttpAgent, Identity } from '@dfinity/agent';
import { AccountIdentifier, LedgerCanister } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';

import { CreateAgentOptions, createAgent } from '../agent';
import { icpToE8s, minterIdentity } from './util';

const ICP_LEDGER_CANISTER_ID = Principal.fromText(
  'ryjl3-tyaaa-aaaaa-aaaba-cai',
);

export class Ledger {
  private readonly ledgerCanister: LedgerCanister;
  private readonly defaultIdentity = new AnonymousIdentity();

  private constructor(private readonly agent: HttpAgent) {
    agent.replaceIdentity(this.defaultIdentity);

    this.ledgerCanister = LedgerCanister.create({
      agent,
      canisterId: ICP_LEDGER_CANISTER_ID,
    });
  }

  public static async create(
    agentOptions: CreateAgentOptions,
  ): Promise<Ledger> {
    const agent = await createAgent(agentOptions);

    return new Ledger(agent);
  }

  public async mint(
    icpAmount: number,
    toAccount: AccountIdentifier,
  ): Promise<bigint> {
    return await this.transfer(minterIdentity, icpAmount, toAccount);
  }

  public async transfer(
    identity: Identity,
    icpAmount: number,
    to: AccountIdentifier,
    memo?: bigint,
  ): Promise<bigint> {
    this.agent.replaceIdentity(identity);

    const blockIndex = await this.ledgerCanister.transfer({
      amount: icpToE8s(icpAmount),
      to,
      memo,
    });

    this.agent.replaceIdentity(this.defaultIdentity);

    return blockIndex;
  }
}
