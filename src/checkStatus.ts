#!/usr/bin/env node
import { ApiPromise } from '@polkadot/api';
import { connectToActiveNetwork, disconnectFromChain } from './utils/connection.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Check the registration status of a parachain
 */
async function checkStatus(): Promise<void> {
  let tanssiApi: ApiPromise | undefined;
  let orchestratorApi: ApiPromise | undefined;
  
  try {
    // Connect to the configured network
    const { network, tanssiApi: tApi, orchestratorApi: oApi } = await connectToActiveNetwork();
    tanssiApi = tApi;
    orchestratorApi = oApi;
    
    console.log('\n=== Checking Registration Status ===');
    console.log(`Network: ${network}\n`);
    
    // Get list of parachains
    const parachains = await tanssiApi.query.paras.parachains();
    console.log('Registered Parachains:', parachains.toHuman());
    
    // Check for specific parachain (example)
    // Uncomment and modify based on your needs:
    /*
    const paraId = 2000;
    const lifecycle = await api.query.paras.paraLifecycles(paraId);
    
    if (lifecycle.isSome) {
      console.log(`\nParachain ${paraId} lifecycle:`, lifecycle.unwrap().toHuman());
    } else {
      console.log(`\nParachain ${paraId} is not registered`);
    }
    */
    
    // Get current block number
    const header = await tanssiApi.rpc.chain.getHeader();
    console.log(`\nCurrent block: #${header.number.toNumber()}`);
    
  } catch (error) {
    console.error('Error checking status:', error);
    process.exit(1);
  } finally {
    await disconnectFromChain(tanssiApi);
    await disconnectFromChain(orchestratorApi);
  }
}

// Run the status check
checkStatus().catch(console.error);
