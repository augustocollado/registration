import { ApiPromise, WsProvider } from '@polkadot/api';
import { getActiveNetwork } from '../config/networks.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to a Substrate-based chain
 * @param endpoint - WebSocket endpoint URL
 * @returns Connected API instance
 */
export async function connectToChain(endpoint: string): Promise<ApiPromise> {
  console.log(`Connecting to ${endpoint}...`);
  
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider });
  
  await api.isReady;
  
  const chain = await api.rpc.system.chain();
  const version = await api.rpc.system.version();
  
  console.log(`Connected to ${chain} (${version})`);
  
  return api;
}

/**
 * Connect to the active network configured in environment
 * @returns Object containing API instances for the network
 */
export async function connectToActiveNetwork(): Promise<{
  network: string;
  tanssiApi: ApiPromise;
  orchestratorApi?: ApiPromise;
}> {
  const { name, config } = getActiveNetwork();
  
  console.log(`\n=== Connecting to ${name.toUpperCase()} network ===`);
  
  const tanssiApi = await connectToChain(config.tanssiEndpoint);
  
  let orchestratorApi: ApiPromise | undefined;
  if (config.orchestratorEndpoint) {
    orchestratorApi = await connectToChain(config.orchestratorEndpoint);
  }
  
  return {
    network: name,
    tanssiApi,
    orchestratorApi,
  };
}

/**
 * Disconnect from the chain
 * @param api - API instance to disconnect
 */
export async function disconnectFromChain(api: ApiPromise | undefined): Promise<void> {
  if (api) {
    await api.disconnect();
    console.log('Disconnected from chain');
  }
}
