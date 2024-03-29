export const DFX_NETWORK = import.meta.DFX_NETWORK ?? 'local';
export const IS_MAINNET = DFX_NETWORK === 'ic';
export const API_GATEWAY = IS_MAINNET
  ? 'https://icp-api.io'
  : window.location.origin;

export const CANISTER_ID_BACKEND = import.meta.CANISTER_ID_BACKEND ?? '';
export const CANISTER_ID_MARKETING = import.meta.CANISTER_ID_MARKETING ?? '';

export const CANISTER_ID_INTERNET_IDENTITY =
  import.meta.CANISTER_ID_INTERNET_IDENTITY ?? '';

export const IDENTITY_PROVIDER = IS_MAINNET
  ? 'https://identity.ic0.app'
  : `http://${CANISTER_ID_INTERNET_IDENTITY}.localhost:8080`;

// don't use derivation origins locally because II rejects them as invalid
// this can be enabled locally once II supports it
// Use this value for local support: `http://${CANISTER_ID_MARKETING}.localhost:8000`;
export const DERIVATION_ORIGIN = IS_MAINNET
  ? `https://${CANISTER_ID_MARKETING}.icp0.io`
  : undefined;
