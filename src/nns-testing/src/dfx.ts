import { exec } from './util';

async function dfxPing(): Promise<void> {
  await exec('dfx ping');
}

export async function checkDfxRunning(): Promise<boolean> {
  try {
    await dfxPing();

    return true;
  } catch {
    return false;
  }
}

export async function getReplicaPort(): Promise<number> {
  const port = await exec('dfx info replica-port');

  return Number(port);
}
