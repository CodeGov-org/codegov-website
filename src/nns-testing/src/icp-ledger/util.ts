import { Ed25519KeyIdentity } from '@dfinity/identity';

export function icpToE8s(icp: number): bigint {
  return BigInt(icp * 1e8);
}

function base64ToUInt8Array(base64String: string): ArrayBuffer {
  return Buffer.from(base64String, 'base64').buffer as ArrayBuffer;
}

const minterPublicKey = 'Uu8wv55BKmk9ZErr6OIt5XR1kpEGXcOSOC1OYzrAwuk=';
const minterPrivateKey =
  'N3HB8Hh2PrWqhWH2Qqgr1vbU9T3gb1zgdBD8ZOdlQnVS7zC/nkEqaT1kSuvo4i3ldHWSkQZdw5I4LU5jOsDC6Q==';

export const minterIdentity = Ed25519KeyIdentity.fromKeyPair(
  base64ToUInt8Array(minterPublicKey),
  base64ToUInt8Array(minterPrivateKey),
);
