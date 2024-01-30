import dotenv from 'dotenv';

dotenv.config({
  debug: true,
  path: '.env',
});

const dfxNetwork = process.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';

const contentVersion: 'published' | 'draft' = isMainnet ? 'published' : 'draft';

export const env = {
  contentVersion,
};
