#!/usr/bin/env node
import { ApiPromise } from '@polkadot/api';
import { connectToActiveNetwork, disconnectFromChain } from './utils/connection.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Parse command line arguments
 */
function parseArgs(): { blockHash: string; account?: string } {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: npm run get-events <blockHash> [account]');
    console.error('Example: npm run get-events 0x4839f56e4fbbe7ebe99aadc10455261078730534f088d2e88cd164c15ae7ffc7');
    console.error('Example: npm run get-events 0x4839f56e4fbbe7ebe99aadc10455261078730534f088d2e88cd164c15ae7ffc7 5Gxxx...');
    process.exit(1);
  }
  
  return {
    blockHash: args[0],
    account: args[1],
  };
}

/**
 * Get events from a specific block
 */
async function getBlockEvents(): Promise<void> {
  let tanssiApi: ApiPromise | undefined;
  let orchestratorApi: ApiPromise | undefined;
  
  try {
    const { blockHash, account } = parseArgs();
    
    console.log(`\n=== Block Events ===`);
    console.log(`Block Hash: ${blockHash}`);
    if (account) {
      console.log(`Filter by Account: ${account}`);
    }
    console.log('');
    
    // Connect to the configured network
    const { network, tanssiApi: tApi, orchestratorApi: oApi } = await connectToActiveNetwork();
    tanssiApi = tApi;
    orchestratorApi = oApi;
    
    // Determine which API to use
    // Flashbox uses orchestrator endpoint
    // Others use tanssi endpoint
    const api = network === 'flashbox' && orchestratorApi ? orchestratorApi : tanssiApi;
    const chainName = network === 'flashbox' && orchestratorApi ? 'Orchestrator' : 'Tanssi';
    
    console.log(`\nQuerying ${chainName} chain...`);
    
    try {
      // Get events at this block (avoid parsing extrinsics to prevent version errors)
      const apiAt = await api.at(blockHash);
      const events = await apiAt.query.system.events();
      
      // Get block header info without parsing extrinsics
      const header = await api.rpc.chain.getHeader(blockHash);
      const blockNumber = header.number.toNumber();
      
      console.log(`Block Number: #${blockNumber}`);
      console.log(`Parent Hash: ${header.parentHash.toHex()}`);
      
      // Filter for registrar.Reserved events
      let reservedEvents = events.filter(({ event }) => 
        event.section === 'registrar' && event.method === 'Reserved'
      );
      
      // Further filter by account if specified
      if (account) {
        reservedEvents = reservedEvents.filter(({ event }) => {
          // param1 is typically the account in Reserved events
          const accountParam = event.data[1]?.toString();
          return accountParam === account;
        });
      }
      
      console.log(`\nTotal Events: ${events.length}`);
      console.log(`registrar.Reserved Events: ${reservedEvents.length}\n`);
      
      if (reservedEvents.length === 0) {
        const msg = account 
          ? `No registrar.Reserved events found for account ${account} in this block.`
          : 'No registrar.Reserved events found in this block.';
        console.log(msg);
      } else {
        reservedEvents.forEach((record, index) => {
          const { event, phase } = record;
          const types = event.typeDef;
          
          console.log(`${index + 1}. ${event.section}.${event.method}`);
          console.log(`   Phase: ${phase.toString()}`);
          
          // Display event data
          if (event.data.length > 0) {
            console.log(`   Data:`);
            event.data.forEach((data, i) => {
              const type = types[i]?.type || 'unknown';
              console.log(`     ${types[i]?.name || `param${i}`} (${type}): ${data.toString()}`);
            });
            
            // Extract ParaId from param0
            const paraId = event.data[0]?.toString();
            console.log(`\n   🎉 Reserved ParaId (param0): ${paraId}`);
          }
          
          console.log('');
        });
      }
      
    } catch (error: any) {
      if (error.message?.includes('Unable to retrieve header')) {
        console.log(`\nBlock not found on ${chainName} chain`);
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error fetching block events:', error);
    process.exit(1);
  } finally {
    await disconnectFromChain(tanssiApi);
    await disconnectFromChain(orchestratorApi);
  }
}

// Run the script
getBlockEvents().catch(console.error);
