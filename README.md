# Tanssi Chain Registration Scripts

TypeScript scripts to register a chain on Tanssi using Polkadot.js API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Add your account mnemonic to `.env` file (keep it secure!)

## Usage

### Reserve a ParaId
```bash
npm run reserve
```

### Register a Chain
```bash
npm run register-chain <paraId> <genesisStatePath> <genesisWasmPath>

# Example:
npm run register-chain 2000 ./genesis-state ./genesis-wasm
```

### Check Registration Status
```bash
npm run check-status
```

### Get Block Events
```bash
npm run get-events <blockHash> [account]

# Examples:
npm run get-events 0x4839f56e4fbbe7ebe99aadc10455261078730534f088d2e88cd164c15ae7ffc7
npm run get-events 0x4839f56e4fbbe7ebe99aadc10455261078730534f088d2e88cd164c15ae7ffc7 5Gxxx...
```
## Project Structure

```
src/
├── reserveParaId.ts     # Reserve a ParaId
├── registerChain.ts     # Register chain with genesis data
├── checkStatus.ts       # Check parachain status
├── getBlockEvents.ts    # Get events from a specific block
├── config/
│   └── networks.ts      # Network configurations
└── utils/
    ├── connection.ts    # Chain connection utilities
    └── account.ts       # Account management utilities
```/
├── reserveParaId.ts     # Reserve a ParaId
├── registerChain.ts     # Register chain with genesis data
├── checkStatus.ts       # Check parachain status
├── config/
│   └── networks.ts      # Network configurations
└── utils/
    ├── connection.ts    # Chain connection utilities
    └── account.ts       # Account management utilities
```

## Workflow

1. **Reserve a ParaId**: `npm run reserve`
2. **Register your chain**: `npm run register-chain <paraId> <genesisState> <genesisWasm>`
3. **Check status**: `npm run check-status`/
├── register.ts          # Main registration script
├── checkStatus.ts       # Check parachain status
└── utils/
    ├── connection.ts    # Chain connection utilities
    └── account.ts       # Account management utilities
```

## Security

⚠️ **Never commit your `.env` file or expose your mnemonic phrase!**

## Documentation

- [Tanssi Documentation](https://docs.tanssi.network/)
- [Polkadot.js API Documentation](https://polkadot.js.org/docs/)
