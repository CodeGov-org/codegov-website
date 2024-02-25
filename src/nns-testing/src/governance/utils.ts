import { createHash, randomBytes } from 'node:crypto';
import { IDL } from '@dfinity/candid';
import { nonNullish } from '@dfinity/utils';
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

function bigEndianU64(value: bigint): Uint8Array {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(value);
  return buffer;
}

const UpdateElectedReplicaVersionsPayload = IDL.Record({
  release_package_urls: IDL.Vec(IDL.Text),
  replica_versions_to_unelect: IDL.Vec(IDL.Text),
  replica_version_to_elect: IDL.Opt(IDL.Text),
  guest_launch_measurement_sha256_hex: IDL.Opt(IDL.Text),
  release_package_sha256_hex: IDL.Opt(IDL.Text),
});

export interface UpdateElectedReplicaVersionsPayload {
  release_package_urls: Array<string>;
  replica_versions_to_unelect: Array<string>;
  replica_version_to_elect: [] | [string];
  guest_launch_measurement_sha256_hex: [] | [string];
  release_package_sha256_hex: [] | [string];
}

export function encodeUpdateElectedReplicaVersionsPayload(
  arg: UpdateElectedReplicaVersionsPayload,
): ArrayBuffer {
  return IDL.encode([UpdateElectedReplicaVersionsPayload], [arg]);
}

export function optional<T>(type: T | null | undefined): [] | [T] {
  return nonNullish(type) ? [type] : [];
}
