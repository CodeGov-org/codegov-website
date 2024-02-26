import { Separator, editor, input, select, confirm } from '@inquirer/prompts';
import { isNullish, nonNullish } from '@dfinity/utils';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import ora from 'ora';

import { Store } from './util';
import { checkDfxRunning, getReplicaPort } from './dfx';
import { Governance } from './governance';

const store = await Store.create();

enum Command {
  GenerateIdentity = 'generateIdentity',
  CreateNeuron = 'createNeuron',
  CreateRvmProposal = 'createRvmProposal',
  CreateRvmProposalWithDefaults = 'createRvmProposalWithDefaults',
  DeleteIdentity = 'deleteIdentity',
  DeleteNeuron = 'deleteNeuron',
  Exit = 'exit',
}

let shouldRun = true;
while (shouldRun) {
  const isDfxRunning = await checkDfxRunning();

  if (!isDfxRunning) {
    console.log('DFX is not running, please start it and try again.');
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
      { name: 'Create RVM proposal', value: Command.CreateRvmProposal },
      {
        name: 'Create RVM proposal (with defaults)',
        value: Command.CreateRvmProposalWithDefaults,
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

      case Command.CreateRvmProposal:
        await createRvmProposal(config);
        break;

      case Command.CreateRvmProposalWithDefaults:
        await createRvmProposal(config, true);
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

  if (nonNullish(identity)) {
    const principal = identity.getPrincipal().toText();
    configString += `\n  Principal: ${principal}`;
  } else {
    configString += '\n  No identity found';
  }

  if (nonNullish(neuronId)) {
    configString += `\n  Neuron ID: ${neuronId}`;
  } else {
    configString += '\n  No neuron ID found';
  }

  configString += '\n';
  console.log(configString);
}

async function generateIdentity(): Promise<Ed25519KeyIdentity> {
  const identity = Ed25519KeyIdentity.generate();

  await store.setIdentity(identity);
  await deleteNeuron();

  return identity;
}

async function createNeuron({ identity, host }: Config): Promise<bigint> {
  if (isNullish(identity)) {
    console.log('No identity found, generating one now...');

    identity = await generateIdentity();
  }

  const spinner = ora().start();
  const governance = await Governance.create({ host: host });

  const neuronId = await governance.createNeuron(identity, spinner);

  try {
    await store.setNeuronId(neuronId.toString());
  } finally {
    spinner.stop();
  }

  return neuronId;
}

async function createRvmProposal(
  config: Config,
  withDefaults = false,
): Promise<void> {
  let { identity } = config;
  let neuronId = 0n;

  if (isNullish(identity)) {
    console.log('No identity found, generating one now...');

    identity = await generateIdentity();
  }

  if (isNullish(config.neuronId)) {
    console.log('No neuron ID found, creating a neuron now...');
    neuronId = await createNeuron({
      ...config,
      identity,
    });
  } else {
    neuronId = BigInt(config.neuronId);
  }

  const governance = await Governance.create({ host: config.host });

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

  const spinner = ora('Creating RVM proposal...').start();

  try {
    await governance.createRvmProposal(identity, {
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
