export const DFX_NETWORK = import.meta.DFX_NETWORK ?? 'local';
export const IS_MAINNET = DFX_NETWORK === 'mainnet';
export const API_GATEWAY = IS_MAINNET ? 'https://icp-api.io' : undefined;
export const BACKEND_CANISTER_ID = import.meta.BACKEND_CANISTER_ID ?? '';
