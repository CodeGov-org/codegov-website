import { type _SERVICE, idlFactory, type LogEntry } from '@cg/backend';
import { Actor, type ActorSubclass, HttpAgent } from '@dfinity/agent';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
import { extractOkResponse } from './utils';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

type BackendActor = ActorSubclass<_SERVICE>;

const createActor = async (env: Env): Promise<BackendActor> => {
  const agent = await HttpAgent.create({
    host: 'https://icp-api.io', // we don't need to log fetcher locally
    identity: Secp256k1KeyIdentity.fromPem(env.IDENTITY_PEM),
  });

  const backendActor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: env.BACKEND_CANISTER_ID,
  });

  return backendActor;
};

const LAST_FETCH_TIMESTAMP_KEY = 'lastFetchTimestamp';

const getLastFetchTimestamp = async (env: Env): Promise<bigint> => {
  const lastFetchTimestampStr = await env.METADATA.get(
    LAST_FETCH_TIMESTAMP_KEY,
  );
  return BigInt(lastFetchTimestampStr || Date.now() - FIVE_MINUTES_IN_MS);
};

const updateLastFetchTimestamp = async (env: Env, timestamp: number) => {
  await env.METADATA.put(LAST_FETCH_TIMESTAMP_KEY, timestamp.toString(10));
};

export const fetchLogs = async (env: Env): Promise<Array<LogEntry>> => {
  const backendActor = await createActor(env);

  const lastFetchTimestamp = await getLastFetchTimestamp(env);

  console.log(
    `Fetching logs since ${new Date(Number(lastFetchTimestamp)).toISOString()}`,
  );

  const res = await backendActor.list_logs({
    after_timestamp_ms: [lastFetchTimestamp],
    before_timestamp_ms: [],
    context_contains_any: [],
    level: [],
    message_contains_any: [],
  });
  const { logs } = extractOkResponse(res);

  await updateLastFetchTimestamp(env, Date.now());

  return logs;
};
