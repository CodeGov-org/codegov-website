import { createHash, randomBytes } from 'node:crypto';
import { SubAccount } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';

export function generateNonce(): bigint {
  return randomBytes(8).readBigUint64BE();
}

export function getNeuronSubaccount(
  controller: Principal,
  nonce: bigint,
): SubAccount {
  const hasher = createHash('sha256');
  hasher.update(new Uint8Array([0x0c]));
  hasher.update(Buffer.from('neuron-stake'));
  hasher.update(controller.toUint8Array());
  hasher.update(bigEndianU64(nonce));

  const subAccount = SubAccount.fromBytes(hasher.digest());

  if (subAccount instanceof Error) {
    throw new Error(`Failed to create neuron subaccount: ${subAccount.cause}`);
  }

  return subAccount;
}

export function bigEndianU64(value: bigint): Uint8Array {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(value);
  return buffer;
}

export function icpToE8s(icp: number): bigint {
  return BigInt(icp * 1e8);
}

export function base64ToUInt8Array(base64String: string): Buffer {
  return Buffer.from(base64String, 'base64');
}
