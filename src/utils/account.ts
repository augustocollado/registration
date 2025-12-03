import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { ApiPromise } from '@polkadot/api';
import '@polkadot/api-augment';

interface BalanceInfo {
  free: string;
  reserved: string;
  frozen: string;
}

/**
 * Load account from mnemonic
 * @param mnemonic - Account mnemonic phrase
 * @returns Account keypair
 */
export async function loadAccount(mnemonic: string): Promise<KeyringPair> {
  await cryptoWaitReady();
  
  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromMnemonic(mnemonic);
  
  console.log(`Loaded account: ${account.address}`);
  
  return account;
}

/**
 * Get account balance
 * @param api - API instance
 * @param address - Account address
 * @returns Account balance information
 */
export async function getBalance(api: ApiPromise, address: string): Promise<BalanceInfo> {
  const { data: balance } = await api.query.system.account(address);
  
  return {
    free: balance.free.toString(),
    reserved: balance.reserved.toString(),
    frozen: balance.frozen.toString(),
  };
}
