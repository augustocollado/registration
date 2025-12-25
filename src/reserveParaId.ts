#!/usr/bin/env node
import { ApiPromise } from '@polkadot/api';
import { connectToActiveNetwork, disconnectFromChain } from './utils/connection.js';
import { loadAccount } from './utils/account.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Reserve a ParaId on the network
 */
async function reserveParaId(): Promise<void> {
  let tanssiApi: ApiPromise | undefined;
  let orchestratorApi: ApiPromise | undefined;
  
  try {
    // Connect to the configured network
    const { network, tanssiApi: tApi, orchestratorApi: oApi } = await connectToActiveNetwork();
    tanssiApi = tApi;
    orchestratorApi = oApi;
    
    // Determine which API to use for reservation
    // Flashbox uses orchestrator, others use tanssi
    const reservationApi = network === 'flashbox' && orchestratorApi ? orchestratorApi : tanssiApi;
    const reservationChain = network === 'flashbox' && orchestratorApi ? 'Orchestrator' : 'Tanssi';

    // Load account
    const mnemonic = process.env.ACCOUNT_MNEMONIC;
    if (!mnemonic) {
      throw new Error('ACCOUNT_MNEMONIC not set in .env file');
    }
    
    const account = await loadAccount(mnemonic);
    console.log(`Reserving ParaId with account: ${account.address}\n`);
    
    // Call registrar.reserve()
    const tx = reservationApi.tx.registrar.reserve();
    
    // Sign and send transaction
    await new Promise<number>((resolve, reject) => {
      tx.signAndSend(account, ({ status, events, dispatchError }) => {
        console.log(`Transaction status: ${status.type}`);
        
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = reservationApi.registry.findMetaError(dispatchError.asModule);
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
          
          // Query events from the finalized block to find the reserved ParaId
          reservationApi.at(blockHash).then(async (apiAt) => {
            const blockEvents = await apiAt.query.system.events();
            
            // Filter for registrar.Reserved events from this account
            const reservedEvents = blockEvents.filter(({ event }) => {
              if (event.section === 'registrar' && event.method === 'Reserved') {
                // Check if param1 matches our account
                const accountParam = event.data[1]?.toString();
                return accountParam === account.address;
              }
              return false;
            });
            
            if (reservedEvents.length === 0) {
              reject(new Error('No registrar.Reserved event found for this account in the finalized block'));
              return;
            }
            
            // Extract ParaId from param0 of the first matching event
            const event = reservedEvents[0].event;
            const paraId = event.data[0]?.toString();
            
            console.log(`\n=== SUCCESS ===`);
            console.log(`Your reserved ParaId: ${paraId}`);
            console.log(`Network: ${network}`);
            console.log(`Block Hash: ${blockHash}`);
            
            resolve(parseInt(paraId, 10));
          }).catch(reject);
        }
      }).catch(reject);
    });
    
  } catch (error) {
    console.error('\n❌ Error reserving ParaId:', error);
    process.exit(1);
  } finally {
    await disconnectFromChain(tanssiApi);
    await disconnectFromChain(orchestratorApi);
  }
}

// Run the reservation
reserveParaId().catch(console.error);
