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

### Check Registration Status
```bash
npm run check-status
```

### Development (with tsx for faster execution)
```bash
npm run dev:reserve
npm run dev:check-status
```

## Project Structure

```
src/
├── reserveParaId.ts     # Reserve a ParaId
├── checkStatus.ts       # Check parachain status
├── config/
│   └── networks.ts      # Network configurations
└── utils/
    ├── connection.ts    # Chain connection utilities
    └── account.ts       # Account management utilities
```

## Workflow

1. **Reserve a ParaId**: `npm run reserve`
2. **Check status**: `npm run check-status`

## Security

⚠️ **Never commit your `.env` file or expose your mnemonic phrase!**

## Documentation

- [Tanssi Documentation](https://docs.tanssi.network/)
- [Polkadot.js API Documentation](https://polkadot.js.org/docs/)
