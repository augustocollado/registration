#!/usr/bin/env node
import { ApiPromise } from '@polkadot/api';
import { connectToActiveNetwork, disconnectFromChain } from './utils/connection.js';
import { loadAccount } from './utils/account.js';
import { chainSpecToContainerChainGenesisData } from './utils/specs.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { exit } from 'process';

dotenv.config();

interface RegisterWithSpecArgs {
  paraId: number;
  chainSpecPath: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): RegisterWithSpecArgs {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run register-with-spec <paraId> <chainSpecPath>');
    console.error('Example: npm run register-with-spec 2000 ./specs/raw-chain-spec.json');
    process.exit(1);
  }
  
  const paraId = parseInt(args[0], 10);
  if (isNaN(paraId)) {
    throw new Error(`Invalid ParaId: ${args[0]}`);
  }
  
  return {
    paraId,
    chainSpecPath: args[1],
  };
}

/**
 * Read chain spec file
 */
function readChainSpec(filePath: string): any {
  const absolutePath = resolve(filePath);
  console.log(`Reading chain spec: ${absolutePath}`);
  
  const content = readFileSync(absolutePath, 'utf-8');
  const chainSpec = JSON.parse(content);
  
  console.log(`Chain spec loaded successfully\n`);
  
  return chainSpec;
}

/**
 * Register a parachain using raw chain spec
 */
async function registerWithChainSpec(): Promise<void> {
  let tanssiApi: ApiPromise | undefined;
  let orchestratorApi: ApiPromise | undefined;
  
  try {
    // Parse command line arguments
    const { paraId, chainSpecPath } = parseArgs();
    
    console.log('\n=== Parachain Registration with Chain Spec ===');
    console.log(`ParaId: ${paraId}`);
    console.log(`Chain Spec: ${chainSpecPath}\n`);
    
    // Connect to the configured network
    const { network, tanssiApi: tApi, orchestratorApi: oApi } = await connectToActiveNetwork();
    tanssiApi = tApi;
    orchestratorApi = oApi;
    
    // Determine which API and pallet to use
    // Flashbox uses tanssi endpoint with containerRegistrar.register
    // Others use tanssi endpoint with registrar.register
    const registrationApi = tanssiApi;
    const pallet = network === 'flashbox' ? 'registrar' : 'containerRegistrar';
    
    console.log(`Using ${pallet}.register on ${network}\n`);
    
    // Load account
    const mnemonic = process.env.ACCOUNT_MNEMONIC;
    if (!mnemonic) {
      throw new Error('ACCOUNT_MNEMONIC not set in .env file');
    }
    
    const account = await loadAccount(mnemonic);
    console.log(`Registering with account: ${account.address}\n`);
    // Read chain spec
    const chainSpec = readChainSpec(chainSpecPath);
    
    // Convert chain spec to container chain genesis data
    console.log('Converting chain spec to genesis data...');
    const genesisData = chainSpecToContainerChainGenesisData(registrationApi, chainSpec);
    console.log('Genesis data converted successfully\n');
    
    // Create transaction with optional third parameter (null for headData)
    const tx = (registrationApi.tx as any)[pallet].register(paraId, genesisData, null);
    
    console.log('Submitting registration transaction...\n');
    
    // Sign and send transaction
    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(account, ({ status, events, dispatchError }: any) => {
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
          const blockHash = status.asFinalized.toHex();
          console.log(`✓ Transaction finalized: ${blockHash}\n`);
          
          // Display events
          console.log('Events:');
          events.forEach(({ event }: any) => {
            console.log(`  ${event.section}.${event.method}`);
            
            // Check for registration success
            if ((event.section === 'containerRegistrar' || event.section === 'registrar') && 
                (event.method === 'Registered' || event.method === 'ParaIdRegistered')) {
              console.log(`\n🎉 ParaId ${paraId} successfully registered!`);
            }
          });
          
          console.log(`\n=== SUCCESS ===`);
          console.log(`ParaId ${paraId} registered on ${network}`);
          console.log(`Block Hash: ${blockHash}`);
          resolve();
        }
      }).catch(reject);
    });
    
  } catch (error) {
    console.error('\n❌ Error registering parachain:', error);
    process.exit(1);
  } finally {
    await disconnectFromChain(tanssiApi);
    await disconnectFromChain(orchestratorApi);
  }
}

// Run the registration
registerWithChainSpec().catch(console.error);
