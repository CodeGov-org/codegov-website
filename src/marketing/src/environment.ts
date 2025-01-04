import dotenv from 'dotenv';

dotenv.config({
  path: '.env',
});

const dfxNetwork = process.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';

const contentVersion: 'published' | 'draft' = isMainnet ? 'published' : 'draft';

export const env = {
  contentVersion,
};
