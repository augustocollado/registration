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
