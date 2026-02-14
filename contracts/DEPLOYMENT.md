# Solchan Deployment Guide

## Prerequisites

- Solana CLI installed (`solana --version`)
- Anchor CLI installed (`anchor --version`)
- A funded wallet for deployment

## Program ID

```
GtEq9zYTMovXz6zXuvJU2zF9p2g6m7j54zPwTgaTuySd
```

## Deploy to Devnet

### 1. Configure Solana CLI for Devnet

```bash
solana config set --url devnet
```

### 2. Ensure Your Wallet Has SOL

Check balance:
```bash
solana balance
```

Airdrop if needed (devnet only):
```bash
solana airdrop 2
```

### 3. Build the Program

```bash
anchor build
```

### 4. Deploy

```bash
anchor deploy --provider.cluster devnet
```

### 5. Initialize Boards

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
yarn init-boards
```

## Deploy to Mainnet

### 1. Configure Solana CLI for Mainnet

```bash
solana config set --url mainnet-beta
```

### 2. Ensure Your Wallet Has SOL

Deployment requires approximately **3-4 SOL** for:
- Program deployment (~2.5 SOL for rent)
- IDL upload (~0.1 SOL)
- Transaction fees

Check balance:
```bash
solana balance
```

### 3. Build the Program (Release)

```bash
anchor build
```

### 4. Deploy

```bash
anchor deploy --provider.cluster mainnet
```

### 5. Initialize Boards

```bash
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
yarn init-boards
```

## Verify Deployment

Check if the program is deployed:
```bash
solana program show GtEq9zYTMovXz6zXuvJU2zF9p2g6m7j54zPwTgaTuySd --url <cluster>
```

Where `<cluster>` is `devnet` or `mainnet-beta`.

## Upgrade Program

To upgrade an existing deployment:

```bash
anchor upgrade target/deploy/solchan.so \
  --program-id GtEq9zYTMovXz6zXuvJU2zF9p2g6m7j54zPwTgaTuySd \
  --provider.cluster <cluster>
```

## Security Notes

- **Keypair Security**: The program keypair at `target/deploy/solchan-keypair.json` controls upgrade authority. Keep it secure.
- **Authority Wallet**: The wallet used to run `init-boards` becomes the program authority and can create boards.
- **Treasury**: By default, the authority wallet is set as the treasury for receiving fees.

## Troubleshooting

### "Insufficient funds for rent"
Ensure your wallet has enough SOL. Deployment requires ~3-4 SOL.

### "Program already deployed"
Use `anchor upgrade` instead of `anchor deploy`.

### "Account already in use"
The config PDA already exists. The init-boards script handles this gracefully.
