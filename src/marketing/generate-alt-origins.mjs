import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dfxNetwork = process.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';

const frontendCanisterId = process.env.FRONTEND_CANISTER_ID ?? '';
const frontedUrl = isMainnet
  ? `https://${frontendCanisterId}.icp0.io`
  : `http://${frontendCanisterId}.localhost:8080`;

const fileContent = {
  alternativeOrigins: [frontedUrl],
};
const targetDir = resolve(__dirname, 'dist', '.well-known');
const filePath = resolve(targetDir, 'ii-alternative-origins');

await mkdir(targetDir, { recursive: true });
await writeFile(filePath, JSON.stringify(fileContent));
