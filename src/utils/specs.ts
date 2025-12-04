/// Utilities to convert from ChainSpec to ContainerChainGenesisData

import { ApiPromise } from "@polkadot/api";
import { stringToHex } from '@polkadot/util';

export function chainSpecToContainerChainGenesisData(paraApi: ApiPromise, chainSpec: any): any {
    const storage = chainSpecStorageToOnChainStorage(chainSpec.genesis);
    const extensions = "0x";
    const properties = chainSpecPropertiesToOnChainProperties(chainSpec.properties);
    
    return {
        "storage": storage,
        "name": stringToHex(chainSpec.name),
        "id": stringToHex(chainSpec.id),
        "forkId": chainSpec.forkId ? stringToHex(chainSpec.forkId) : null,
        "extensions": extensions,
        "properties": properties,
    };
}

function chainSpecStorageToOnChainStorage(genesis: any): any {
    return Object.entries(genesis.raw.top).map(keyValue => {
        const [key, value] = keyValue;
        
        return {
            "key": key,
            "value": value,
        }
    })
}

function chainSpecPropertiesToOnChainProperties(properties: any): any {
    return {
        "tokenMetadata": {
            "tokenSymbol": stringToHex(properties.tokenSymbol),
            "ss58Format": properties.ss58Format,
            "tokenDecimals": properties.tokenDecimals,
        },
        "isEthereum": properties.isEthereum || false,
    }
}