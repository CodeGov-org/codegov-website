import { Separator, editor, input, select, confirm } from '@inquirer/prompts';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import ora, { Ora } from 'ora';

import { Store } from './util';
import { checkDfxRunning, getReplicaPort } from './dfx';
import { Governance } from './governance';
import { isNil, isNotNil } from '@cg/utils';

const store = await Store.create();

enum Command {
  GenerateIdentity = 'generateIdentity',
  CreateNeuron = 'createNeuron',
  SyncMainnetProposal = 'syncMainnetProposal',
  CreateIcOsVersionElectionProposal = 'createIcOsVersionElectionProposal',
  CreateIcOsVersionElectionProposalWithDefaults = 'createIcOsVersionElectionProposalWithDefaults',
  DeleteIdentity = 'deleteIdentity',
  DeleteNeuron = 'deleteNeuron',
  Exit = 'exit',
}

let shouldRun = true;
while (shouldRun) {
  const isDfxRunning = await checkDfxRunning();

  if (!isDfxRunning) {
    console.info('DFX is not running, please start it and try again.');
    shouldRun = false;
    break;
  }

  console.clear();
  const config = await getConfig();
  printConfig(config);

  const answer = await select({
    message: 'What would you like to do?',
    pageSize: 10,
    choices: [
      { name: 'Generate an identity', value: Command.GenerateIdentity },
      { name: 'Create a neuron', value: Command.CreateNeuron },
      new Separator(),
      {
        name: 'Sync mainnet proposal',
        value: Command.SyncMainnetProposal,
      },
      {
        name: 'Create IcOsVersionElection proposal',
        value: Command.CreateIcOsVersionElectionProposal,
      },
      {
        name: 'Create IcOsVersionElection proposal (with defaults)',
        value: Command.CreateIcOsVersionElectionProposalWithDefaults,
      },
      new Separator(),
      { name: 'Delete identity', value: Command.DeleteIdentity },
      { name: 'Delete neuron', value: Command.DeleteNeuron },
      new Separator(),
      { name: 'Exit', value: Command.Exit },
    ],
  });

  try {
    switch (answer) {
      case Command.GenerateIdentity:
        await generateIdentity();
        break;

      case Command.CreateNeuron:
        await createNeuron(config);
        break;

      case Command.SyncMainnetProposal:
        await syncMainnetProposal(config);
        break;

      case Command.CreateIcOsVersionElectionProposal:
        await createIcOsVersionElectionProposal(config);
        break;

      case Command.CreateIcOsVersionElectionProposalWithDefaults:
        await createIcOsVersionElectionProposal(config, true);
        break;

      case Command.DeleteIdentity:
        await deleteIdentity();
        break;

      case Command.DeleteNeuron:
        await deleteNeuron();
        break;

      case Command.Exit:
        shouldRun = false;
        console.clear();
        break;
    }
  } catch (error) {
    console.error('An error occurred');
    console.error(error);

    const shouldContinue = await confirm({
      message: 'Would you like to continue?',
      default: true,
    });

    if (!shouldContinue) {
      shouldRun = false;
      console.clear();
      break;
    }
  }
}

interface Config {
  neuronId: string | undefined;
  replicaPort: number;
  host: string;
  identity: Ed25519KeyIdentity | undefined;
}

async function getConfig(): Promise<Config> {
  const neuronId = await store.getNeuronId();

  const replicaPort = await getReplicaPort();
  const host = `http://localhost:${replicaPort}`;

  const identity = await store.getIdentity();

  return {
    neuronId,
    replicaPort,
    host,
    identity,
  };
}

function printConfig({ neuronId, replicaPort, host, identity }: Config): void {
  let configString = `
*** Configuration ***

  Replica port: ${replicaPort}
  Replica host: ${host}`;

  if (isNotNil(identity)) {
    const principal = identity.getPrincipal().toText();
    configString += `\n  Principal: ${principal}`;
  } else {
    configString += '\n  No identity found';
  }

  if (isNotNil(neuronId)) {
    configString += `\n  Neuron ID: ${neuronId}`;
  } else {
    configString += '\n  No neuron ID found';
  }

  configString += '\n';
  console.info(configString);
}

async function generateIdentity(): Promise<Ed25519KeyIdentity> {
  const identity = Ed25519KeyIdentity.generate();

  await store.setIdentity(identity);
  await deleteNeuron();

  return identity;
}

async function createNeuron(config: Config): Promise<bigint> {
  const spinner = ora().start();

  try {
    const identity = await getOrCreateIdentity(config.identity, spinner);
    const governance = await Governance.create({ host: config.host });
    const neuronId = await governance.createNeuron(identity, spinner);

    await store.setNeuronId(neuronId.toString());
    return neuronId;
  } finally {
    spinner.stop();
  }
}

async function syncMainnetProposal(config: Config): Promise<void> {
  console.log('Config', config);
  const spinner = ora().start();
  const identity = await getOrCreateIdentity(config.identity, spinner);
  const neuronId = await getOrCreateNeuron(identity, config, spinner);
  spinner.stop();

  const governance = await Governance.create({ host: config.host });
  const proposalId = await input({
    message: 'Enter the proposal ID to sync:',
  });

  spinner.start('Syncing mainnet proposal...');

  try {
    await governance.syncMainnetProposal(
      identity,
      {
        neuronId,
        proposalId: BigInt(proposalId),
      },
      spinner,
    );
  } finally {
    spinner.stop();
  }
}

async function createIcOsVersionElectionProposal(
  config: Config,
  withDefaults = false,
): Promise<void> {
  const spinner = ora().start();

  const identity = await getOrCreateIdentity(config.identity, spinner);
  const neuronId = await getOrCreateNeuron(identity, config, spinner);
  const governance = await Governance.create({ host: config.host });

  spinner.stop();

  const title = await input({
    message: 'Enter the proposal title:',
    default: withDefaults
      ? 'Elect new IC/Replica revision (commit 85bd56a7)'
      : undefined,
  });

  const summary = await editor({
    message: 'Enter the proposal summary:',
    default: withDefaults
      ? "Elect new replica binary revision [85bd56a70e55b2cea75cae6405ae11243e5fdad8](https://github.com/dfinity/ic/tree/release-2024-02-21_23-01-p2p)\n\n# Release Notes:\n\nChange log since git revision [2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f](https://dashboard.internetcomputer.org/release/2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f)\n## Features:\n* [[85bd56a70](https://github.com/dfinity/ic/commit/85bd56a70)]  enable new p2p for consensus\n\nForum post: https://forum.dfinity.org/t/new-release-rc-2024-02-21-23-01/27834\n\n\n# IC-OS Verification\n\nTo build and verify the IC-OS disk image, run:\n\n```\n# From https://github.com/dfinity/ic#verifying-releases\nsudo apt-get install -y curl && curl --proto '=https' --tlsv1.2 -sSLO https://raw.githubusercontent.com/dfinity/ic/85bd56a70e55b2cea75cae6405ae11243e5fdad8/gitlab-ci/tools/repro-check.sh && chmod +x repro-check.sh && ./repro-check.sh -c 85bd56a70e55b2cea75cae6405ae11243e5fdad8\n```\n\nThe two SHA256 sums printed above from a) the downloaded CDN image and b) the locally built image,\nmust be identical, and must match the SHA256 from the payload of the NNS proposal."
      : undefined,
    postfix: '.md',
  });

  const replicaVersion = await input({
    message: 'Enter the new replica version:',
    default: withDefaults
      ? '85bd56a70e55b2cea75cae6405ae11243e5fdad8'
      : undefined,
  });

  spinner.start('Creating IcOsVersionElection proposal...');
  try {
    await governance.createIcOsVersionElectionProposal(identity, {
      neuronId,
      title,
      summary,
      replicaVersion,
    });
  } finally {
    spinner.stop();
  }
}

async function deleteIdentity(): Promise<void> {
  await store.deleteIdentity();
  await deleteNeuron();
}

async function deleteNeuron(): Promise<void> {
  await store.deleteNeuronId();
}

async function getOrCreateIdentity(
  identity: Ed25519KeyIdentity | undefined,
  spinner: Ora,
): Promise<Ed25519KeyIdentity> {
  if (isNil(identity)) {
    spinner.text = 'No identity found, generating one now...';
    identity = await generateIdentity();
  }

  return identity;
}

async function getOrCreateNeuron(
  identity: Ed25519KeyIdentity,
  config: Config,
  spinner: Ora,
): Promise<bigint> {
  let neuronId = 0n;

  if (isNil(config.neuronId)) {
    spinner.text = 'No neuron ID found, creating a neuron now...';
    neuronId = await createNeuron({
      ...config,
      identity,
    });
  } else {
    neuronId = BigInt(config.neuronId);
  }

  console.log('Neuron id', neuronId);

  return neuronId;
}
