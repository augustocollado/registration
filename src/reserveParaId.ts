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
    
    console.log(`\nUsing ${reservationChain} chain for ParaId reservation`);
    
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
          console.log(`✓ Transaction finalized: ${status.asFinalized.toHex()}\n`);
          
          // Look for Reserved event to get ParaId
          let paraId: number | undefined;
          
          events.forEach(({ event }) => {
            console.log(`Event: ${event.section}.${event.method}`);
            
            // Check for registrar.Reserved event
            if (event.section === 'registrar' && event.method === 'Reserved') {
              const data = event.data.toJSON() as any;
              paraId = Array.isArray(data) ? data[0] : data.paraId;
              console.log(`\n🎉 ParaId Reserved: ${paraId}`);
            }
          });
          
          if (paraId !== undefined) {
            console.log(`\n=== SUCCESS ===`);
            console.log(`Your reserved ParaId: ${paraId}`);
            console.log(`Network: ${network}`);
            resolve(paraId);
          } else {
            reject(new Error('ParaId not found in transaction events'));
          }
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
