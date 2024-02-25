import { HttpAgent } from '@dfinity/agent';

export interface CreateAgentOptions {
  host: string;
}

export async function createAgent({
  host,
}: CreateAgentOptions): Promise<HttpAgent> {
  const agent = new HttpAgent({
    host,
  });

  await agent.fetchRootKey();

  return agent;
}
