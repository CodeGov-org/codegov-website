import { nonNullish } from '@dfinity/utils';
import { exec as nodeExec } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const nodeExecAsync = promisify(nodeExec);

const cwd = resolve(import.meta.dir, '..', '..', '..', '..');

export async function exec(command: string): Promise<string> {
  const result = await nodeExecAsync(command, {
    cwd,
  });

  if (nonNullish(result.stderr) && result.stderr.length > 0) {
    console.error(result.stderr);
    throw new Error(result.stderr);
  }

  return result.stdout;
}
