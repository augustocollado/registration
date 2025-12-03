/**
 * Network configuration for Tanssi chain registration
 */

export interface NetworkConfig {
  tanssiEndpoint: string;
  orchestratorEndpoint?: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  flashbox: {
    tanssiEndpoint: 'wss://fraa-flashbox-rpc.a.stagenet.tanssi.network',
    orchestratorEndpoint: 'wss://fraa-flashbox-relay-rpc.a.stagenet.tanssi.network',
  },
  dancelight: {
    tanssiEndpoint: 'wss://services.tanssi-testnet.network/dancelight',
  },
  mainnet: {
    tanssiEndpoint: 'wss://services.tanssi-mainnet.network/tanssi',
  },
};

/**
 * Get network configuration by name
 * @param networkName - Name of the network (flashbox, dancelight, mainnet)
 * @returns Network configuration
 * @throws Error if network is not found
 */
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = NETWORKS[networkName.toLowerCase()];
  
  if (!config) {
    const availableNetworks = Object.keys(NETWORKS).join(', ');
    throw new Error(
      `Unknown network: ${networkName}. Available networks: ${availableNetworks}`
    );
  }
  
  return config;
}

/**
 * Get the active network from environment or default
 * @returns Network configuration
 */
export function getActiveNetwork(): { name: string; config: NetworkConfig } {
  const networkName = process.env.NETWORK || 'dancelight';
  const config = getNetworkConfig(networkName);
  
  return {
    name: networkName,
    config,
  };
}
