export const DFX_NETWORK = import.meta.DFX_NETWORK ?? 'local';
export const IS_MAINNET = DFX_NETWORK === 'ic';
export const API_GATEWAY = IS_MAINNET
  ? 'https://icp-api.io'
  : window.location.origin;

export const CANISTER_ID_BACKEND = import.meta.CANISTER_ID_BACKEND ?? '';
export const BACKEND_ORIGIN = IS_MAINNET
  ? `https://${CANISTER_ID_BACKEND}.icp0.io`
  : `http://${CANISTER_ID_BACKEND}.localhost:8080`;

export const CANISTER_ID_INTERNET_IDENTITY =
  import.meta.CANISTER_ID_INTERNET_IDENTITY ?? '';

export const IDENTITY_PROVIDER = IS_MAINNET
  ? 'https://identity.ic0.app'
  : `http://${CANISTER_ID_INTERNET_IDENTITY}.localhost:8080`;
