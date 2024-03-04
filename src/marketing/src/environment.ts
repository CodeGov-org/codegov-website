const dfxNetwork = import.meta.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';

const contentVersion: 'published' | 'draft' = isMainnet ? 'published' : 'draft';

const internetIdentityCanisterId =
  import.meta.env.INTERNET_IDENTITY_CANISTER_ID ?? '';

export const identityProvider = isMainnet
  ? 'https://identity.ic0.app'
  : `http://${internetIdentityCanisterId}.localhost:8080`;

export const env = {
  contentVersion,
  identityProvider,
};

console.log('meta', import.meta.env);
console.log('env', env);
