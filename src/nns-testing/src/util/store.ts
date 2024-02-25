import { Ed25519KeyIdentity } from '@dfinity/identity';
import { readFile, writeFile, exists } from 'node:fs/promises';
import { resolve } from 'node:path';

const STORE_FILENAME = 'data.json';
const STORE_FILEPATH = resolve(import.meta.dir, '..', '..', STORE_FILENAME);

interface StoreData {
  [key: string]: string;
}

const NEURON_ID_KEY = 'neuronId';
const IDENTITY_KEY = 'identity';

export class Store {
  private data: StoreData = {};

  private constructor() {}

  public static async create(): Promise<Store> {
    const store = new Store();
    await store.readStore();

    return store;
  }

  public async getNeuronId(): Promise<string | undefined> {
    return await this.get(NEURON_ID_KEY);
  }

  public async setNeuronId(value: string): Promise<void> {
    await this.set(NEURON_ID_KEY, value);
  }

  public async deleteNeuronId(): Promise<void> {
    await this.delete(NEURON_ID_KEY);
  }

  public async getIdentity(): Promise<Ed25519KeyIdentity | undefined> {
    const identity = await this.get(IDENTITY_KEY);
    if (identity === undefined) {
      return undefined;
    }

    const parsedIdentity = JSON.parse(identity);
    return Ed25519KeyIdentity.fromParsedJson(parsedIdentity);
  }

  public async setIdentity(value: Ed25519KeyIdentity): Promise<void> {
    await this.set(IDENTITY_KEY, stringify(value.toJSON()));
  }

  public async deleteIdentity(): Promise<void> {
    await this.delete(IDENTITY_KEY);
  }

  private async get(key: string): Promise<string | undefined> {
    await this.readStore();

    return this.data[key];
  }

  private async set(key: string, value: string): Promise<void> {
    await this.readStore();

    this.data[key] = value;

    await this.writeStore();
  }

  private async delete(key: string): Promise<void> {
    delete this.data[key];
    await this.writeStore();
  }

  private async readStore(): Promise<void> {
    const storeExists = await exists(STORE_FILEPATH);
    if (!storeExists) {
      await this.writeStore();
    }

    const data = await readFile(STORE_FILEPATH, 'utf8');

    this.data = JSON.parse(data);
  }

  private async writeStore(): Promise<void> {
    await writeFile(STORE_FILEPATH, stringify(this.data));
  }
}

function stringify<T>(value: T): string {
  return JSON.stringify(value, null, 2);
}
