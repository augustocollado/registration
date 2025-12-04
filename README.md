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

# Or for development (faster):
npm run dev:reserve
```

### Register a Parachain (with genesis files)
```bash
npm run register <paraId> <genesisDataPath> <genesisWasmPath>

# Example:
npm run register 2000 ./specs/genesis-data ./specs/genesis-wasm

# Or for development:
npm run dev:register 2000 ./specs/genesis-data ./specs/genesis-wasm
```

### Register a Parachain (with chain spec)
```bash
npm run register-with-spec <paraId> <chainSpecPath>

# Example:
npm run register-with-spec 2000 ./specs/raw-chain-spec.json

# Or for development:
npm run dev:register-with-spec 2000 ./specs/raw-chain-spec.json
```

## Project Structure

```
src/
├── reserveParaId.ts       # Reserve a ParaId
├── register.ts            # Register a parachain with genesis files
├── registerWithSpec.ts    # Register a parachain with chain spec
├── config/
│   └── networks.ts        # Network configurations
└── utils/
    ├── connection.ts      # Chain connection utilities
    └── account.ts         # Account management utilities
```

## Workflow

1. **Reserve a ParaId**: `npm run reserve`
2. **Register your parachain**:
   - With genesis files: `npm run register <paraId> <genesisData> <genesisWasm>`
   - With chain spec: `npm run register-with-spec <paraId> <chainSpec.json>`
## Project Structure

```
src/
├── reserveParaId.ts     # Reserve a ParaId
├── config/
│   └── networks.ts      # Network configurations
└── utils/
    ├── connection.ts    # Chain connection utilities
    └── account.ts       # Account management utilities
```

## Security

⚠️ **Never commit your `.env` file or expose your mnemonic phrase!**

## Documentation

- [Tanssi Documentation](https://docs.tanssi.network/)
- [Polkadot.js API Documentation](https://polkadot.js.org/docs/)
