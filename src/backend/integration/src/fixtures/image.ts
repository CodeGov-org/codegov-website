import { readFileSync } from "fs";
import { resolve } from "path";

const CODEGOV_LOGO_PATH = resolve(
  __dirname,
  'codegov-logo.png',
);

export const CODEGOV_LOGO_PNG = new Uint8Array(readFileSync(CODEGOV_LOGO_PATH));
