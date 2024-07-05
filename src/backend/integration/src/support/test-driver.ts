import { _SERVICE as BackendService, idlFactory } from '@cg/backend';
import { Principal } from '@dfinity/principal';
import {
  Actor,
  CanisterFixture,
  PocketIc,
  SubnetStateType,
} from '@hadronous/pic';
import { resolve } from 'node:path';
import { controllerIdentity } from './identity';
import { UsersOM } from './users';

const NNS_SUBNET_ID =
  'rtjtm-svxtv-4remx-pabjc-u5viw-am5ew-v4ppc-ozs5u-xmzbc-4ndhz-3ae';

const NNS_STATE_PATH = resolve(
  __dirname,
  '..',
  '..',
  'state',
  'nns_state',
  'node-100',
  'state',
);

const NNS_CREATION_DATE = new Date(2024, 6, 29, 13, 55, 0, 0);

export const BACKEND_WASM_PATH = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '.dfx',
  'local',
  'canisters',
  'backend',
  'backend.wasm.gz',
);

export class TestDriver {
  public get actor(): Actor<BackendService> {
    return this.fixture.actor;
  }

  public get canisterId(): Principal {
    return this.fixture.canisterId;
  }

  public readonly users: UsersOM;

  private constructor(
    public readonly pic: PocketIc,
    private readonly fixture: CanisterFixture<BackendService>,
  ) {
    this.users = new UsersOM(this.createActor());
  }

  public static async create(initialDate = new Date()): Promise<TestDriver> {
    const pic = await PocketIc.create(process.env.PIC_URL);
    await pic.setTime(initialDate);
    const fixture = await this.setupBackendCanister(pic);

    return new TestDriver(pic, fixture);
  }

  public static async createWithNnsState(): Promise<TestDriver> {
    const pic = await PocketIc.create(process.env.PIC_URL, {
      nns: {
        state: {
          type: SubnetStateType.FromPath,
          path: NNS_STATE_PATH,
          subnetId: Principal.fromText(NNS_SUBNET_ID),
        },
      },
    });
    await pic.setTime(NNS_CREATION_DATE.getTime());
    const fixture = await this.setupBackendCanister(pic);

    return new TestDriver(pic, fixture);
  }

  private static async setupBackendCanister(
    pic: PocketIc,
  ): Promise<CanisterFixture<BackendService>> {
    const fixture = await pic.setupCanister<BackendService>({
      idlFactory,
      wasm: BACKEND_WASM_PATH,
      sender: controllerIdentity.getPrincipal(),
    });

    // make sure init timers run
    await pic.tick(2);

    return fixture;
  }

  public async resetBackendCanister(): Promise<void> {
    await this.pic.reinstallCode({
      canisterId: this.canisterId,
      wasm: BACKEND_WASM_PATH,
      sender: controllerIdentity.getPrincipal(),
    });

    // make sure init timers run
    await this.pic.tick(2);
  }

  public async getCurrentDate(): Promise<Date> {
    const currentTime = await this.pic.getTime();

    return new Date(currentTime);
  }

  public async tearDown(): Promise<void> {
    await this.pic.tearDown();
  }

  public async advanceTime(millis: number): Promise<void> {
    await this.pic.advanceTime(millis);
    // make sure eventual timers run
    await this.pic.tick(2);
  }

  private createActor(): Actor<BackendService> {
    return this.pic.createActor(idlFactory, this.canisterId);
  }
}
