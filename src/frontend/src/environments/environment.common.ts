export const DFX_NETWORK = import.meta.DFX_NETWORK ?? 'local';
export const IS_MAINNET = DFX_NETWORK === 'ic';
export const API_GATEWAY = IS_MAINNET
  ? 'https://icp-api.io'
  : window.location.origin;

export const BACKEND_CANISTER_ID = import.meta.BACKEND_CANISTER_ID ?? '';
export const MARKETING_CANISTER_ID = import.meta.MARKETING_CANISTER_ID ?? '';

export const IDENTITY_PROVIDER = IS_MAINNET
  ? 'https://identity.ic0.app/'
  : 'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/';

// don't use derivation origins locally because II rejects them as invalid
// this can be enabled locally once II supports it
// Use this value for local support: `http://${MARKETING_CANISTER_ID}.localhost:8000`;
export const DERIVATION_ORIGIN = IS_MAINNET
  ? `https://${MARKETING_CANISTER_ID}.icp0.io`
  : undefined;
