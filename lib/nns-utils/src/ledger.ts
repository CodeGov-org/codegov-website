import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { base64ToUInt8Array } from './util';

export const ICP_LEDGER_CANISTER_ID = Principal.fromText(
  'ryjl3-tyaaa-aaaaa-aaaba-cai',
);

const minterPublicKey = 'Uu8wv55BKmk9ZErr6OIt5XR1kpEGXcOSOC1OYzrAwuk=';
const minterPrivateKey =
  'N3HB8Hh2PrWqhWH2Qqgr1vbU9T3gb1zgdBD8ZOdlQnVS7zC/nkEqaT1kSuvo4i3ldHWSkQZdw5I4LU5jOsDC6Q==';

export const minterIdentity = Ed25519KeyIdentity.fromKeyPair(
  base64ToUInt8Array(minterPublicKey),
  base64ToUInt8Array(minterPrivateKey),
);
