import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { Actor, PocketIc } from '@hadronous/pic';
import { LedgerDeclarations } from '@cg/nns-utils';
import { ICP_LEDGER_CANISTER_ID, minterIdentity } from '@cg/nns-utils';

type LedgerService = LedgerDeclarations._SERVICE;
type SubAccount = LedgerDeclarations.SubAccount;
const ledgerIdlFactory = LedgerDeclarations.idlFactory;

const DEFAULT_FEE = 10_000n;

export class Ledger {
  private readonly actor: Actor<LedgerService>;
  private readonly defaultIdentity = new AnonymousIdentity();

  constructor(pic: PocketIc) {
    this.actor = pic.createActor<LedgerService>(
      ledgerIdlFactory,
      ICP_LEDGER_CANISTER_ID,
    );
  }

  public async mint(
    amountE8s: bigint,
    toAccount: Principal,
    toSubAccount?: SubAccount,
    memo?: Uint8Array | number[],
  ): Promise<void> {
    return await this.transfer(
      minterIdentity,
      amountE8s,
      toAccount,
      toSubAccount,
      memo,
    );
  }

  public async transfer(
    identity: Identity,
    amountE8s: bigint,
    toAccount: Principal,
    toSubAccount?: SubAccount,
    memo?: Uint8Array | number[],
  ): Promise<void> {
    this.actor.setIdentity(identity);
    const subaccount: [] | [SubAccount] = toSubAccount ? [toSubAccount] : [];
    const optMemo: [] | [Uint8Array | number[]] = memo ? [memo] : [];

    const fromBalance = await this.actor.icrc1_balance_of({
      owner: identity.getPrincipal(),
      subaccount: [],
    });
    const toBalance = await this.actor.icrc1_balance_of({
      owner: toAccount,
      subaccount,
    });

    const result = await this.actor.icrc1_transfer({
      amount: amountE8s,
      to: {
        owner: toAccount,
        subaccount,
      },
      memo: optMemo,
      fee: [DEFAULT_FEE],
      created_at_time: [],
      from_subaccount: [],
    });
    if ('Err' in result) {
      const error = result.Err;
      throw new Error(`${error}`);
    }

    const updatedFromBalance = await this.actor.icrc1_balance_of({
      owner: identity.getPrincipal(),
      subaccount: [],
    });

    if (updatedFromBalance !== fromBalance - amountE8s - DEFAULT_FEE) {
      throw new Error('Transfer failed');
    }

    const updatedToBalance = await this.actor.icrc1_balance_of({
      owner: toAccount,
      subaccount,
    });

    if (updatedToBalance !== toBalance + amountE8s) {
      throw new Error('Transfer failed');
    }

    this.actor.setIdentity(this.defaultIdentity);
  }
}
