#!/usr/bin/env node
import { ApiPromise } from '@polkadot/api';
import { connectToActiveNetwork, disconnectFromChain } from './utils/connection.js';
import { loadAccount } from './utils/account.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface RegisterArgs {
  paraId: number;
  genesisStatePath: string;
  genesisWasmPath: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): RegisterArgs {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: npm run register-chain <paraId> <genesisStatePath> <genesisWasmPath>');
    console.error('Example: npm run register-chain 2000 genesis-state genesis-wasm');
    process.exit(1);
  }
  
  const paraId = parseInt(args[0], 10);
  if (isNaN(paraId)) {
    throw new Error(`Invalid ParaId: ${args[0]}`);
  }
  
  return {
    paraId,
    genesisStatePath: args[1],
    genesisWasmPath: args[2],
  };
}

/**
 * Read file and convert to hex string
 */
function readFileAsHex(filePath: string): string {
  const absolutePath = resolve(filePath);
  console.log(`Reading file: ${absolutePath}`);
  
  const buffer = readFileSync(absolutePath);
  const hex = '0x' + buffer.toString('hex');
  
  console.log(`File size: ${buffer.length} bytes`);
  
  return hex;
}

/**
 * Register a parachain with genesis state and wasm
 */
async function registerChain(): Promise<void> {
  let tanssiApi: ApiPromise | undefined;
  let orchestratorApi: ApiPromise | undefined;
  
  try {
    // Parse command line arguments
    const { paraId, genesisStatePath, genesisWasmPath } = parseArgs();
    
    console.log('\n=== Chain Registration ===');
    console.log(`ParaId: ${paraId}`);
    console.log(`Genesis State: ${genesisStatePath}`);
    console.log(`Genesis Wasm: ${genesisWasmPath}\n`);
    
    // Connect to the configured network
    const { network, tanssiApi: tApi, orchestratorApi: oApi } = await connectToActiveNetwork();
    tanssiApi = tApi;
    orchestratorApi = oApi;
    
    // Determine which API to use
    // Flashbox uses orchestrator endpoint with registrar.register
    // Others use tanssi endpoint with registrar.register
    const registrationApi = network === 'flashbox' && orchestratorApi ? orchestratorApi : tanssiApi;
    const registrationChain = network === 'flashbox' && orchestratorApi ? 'Orchestrator' : 'Tanssi';
    
    console.log(`Using registrar.register on ${registrationChain} chain\n`);
    
    // Load account
    const mnemonic = process.env.ACCOUNT_MNEMONIC;
    if (!mnemonic) {
      throw new Error('ACCOUNT_MNEMONIC not set in .env file');
    }
    
    const account = await loadAccount(mnemonic);
    console.log(`Registering with account: ${account.address}\n`);
    
    // Read genesis files
    console.log('Reading genesis files...');
    const genesisState = readFileAsHex(genesisStatePath);
    const genesisWasm = readFileAsHex(genesisWasmPath);
    console.log('');
    
    // Create transaction
    const tx = registrationApi.tx.registrar.register(paraId, genesisState, genesisWasm);
    
    console.log('Submitting registration transaction...\n');
    
    // Sign and send transaction
    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(account, ({ status, events, dispatchError }) => {
        console.log(`Transaction status: ${status.type}`);
        
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = registrationApi.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;
            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        }
        
        if (status.isInBlock) {
          console.log(`\n✓ Transaction included in block: ${status.asInBlock.toHex()}`);
        }
        
        if (status.isFinalized) {
          console.log(`✓ Transaction finalized: ${status.asFinalized.toHex()}\n`);
          
          // Display events
          events.forEach(({ event }) => {
            console.log(`Event: ${event.section}.${event.method}`);
            
            // Check for registration success
            if (event.section === 'registrar' && event.method === 'ParaIdRegistered') {
              console.log(`\n🎉 ParaId ${paraId} successfully registered!`);
            }
          });
          
          console.log(`\n=== SUCCESS ===`);
          console.log(`ParaId ${paraId} registered on ${network}`);
          resolve();
        }
      }).catch(reject);
    });
    
  } catch (error) {
    console.error('\n❌ Error registering chain:', error);
    process.exit(1);
  } finally {
    await disconnectFromChain(tanssiApi);
    await disconnectFromChain(orchestratorApi);
  }
}

// Run the registration
registerChain().catch(console.error);
