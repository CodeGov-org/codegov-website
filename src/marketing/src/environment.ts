import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '..', '..', '.env'),
});

const dfxNetwork = process.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';

const contentVersion: 'published' | 'draft' = isMainnet ? 'published' : 'draft';

export const env = {
  contentVersion,
};
