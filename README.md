# 💎 TON Tool — Multi-Wallet Trading Terminal

[![TON](https://img.shields.io/badge/TON-Blockchain-0088CC?logo=ton&logoColor=white)](https://ton.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![STON.fi](https://img.shields.io/badge/STON.fi-DEX-blue)](https://ston.fi)
[![DeDust](https://img.shields.io/badge/DeDust-DEX-purple)](https://dedust.io)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **A professional multi-wallet trading tool for the TON blockchain.** Create, manage, and execute token swaps across multiple wallets simultaneously on STON.fi and DeDust DEXs.

Built for traders who need to manage multiple TON wallets and execute batch buy/sell operations efficiently.

---

## ✨ Features

### 🏦 Multi-Wallet Management
- **Batch create** up to 50 wallets at once with auto-generated mnemonics
- **Import wallets** via 24-word mnemonic phrase
- **Export/Import** wallet collections as JSON for backup & portability
- **Copy** address, private key, or mnemonic with one click
- View on [Tonscan](https://tonscan.org) directly from the UI

### 📊 Real-Time Portfolio Tracking
- Live **TON balance** for all wallets
- Live **Jetton (token) balance** with **% of total supply** indicator
- Batch balance refresh with smart rate limiting
- Auto-detect token metadata (name, symbol, decimals)

### 🔄 DEX Swap Engine
- **STON.fi** — Dynamic router discovery via `StonApiClient.simulateSwap()`, automatic pTON + router version resolution
- **DeDust** — Manual cell building matching `VaultNative.sendSwap` opcode (`0xea06185d`), native TON and Jetton-to-TON swaps
- **Multi Buy / Multi Sell** — Execute swaps across all wallets in one click
- Configurable **slippage tolerance** (0.5% / 1% / 3% / 5% / 10%)

### ⚙️ Infrastructure
- **TonCenter API v2/v3** with user-configurable API key (unlimited RPS)
- Built-in retry mechanism with exponential backoff for transient errors
- Handles undeployed wallets gracefully (auto-deploy on first TX)
- Transaction logs with full history

---

## 🖥️ Screenshots

<details>
<summary>Click to expand</summary>

| Dashboard | Swap Modal |
|-----------|------------|
| Multi-wallet grid with live balances | Buy/Sell with DEX selection & slippage |

</details>

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- A [TonCenter API key](https://t.me/tonapibot) (free, recommended for unlimited RPS)

### Installation

```bash
git clone https://github.com/noweieth/ton-tool.git
cd ton-tool
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Get TonCenter API Key (Free)

1. Open Telegram → search for [@tonapibot](https://t.me/tonapibot)
2. Press `/start` → select **Manage API Keys**
3. Create new key → select **mainnet** → paste into TON Tool settings

---

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.js           # Root layout + Font Awesome 6
│   ├── globals.css         # Design system (dark theme)
│   └── page.js             # Main dashboard page
├── components/
│   ├── Sidebar/            # Token selector, wallet manager, trading tools, API settings
│   ├── WalletGrid/         # Wallet cards grid/list view
│   ├── Modals/             # Create, Import, Swap modals
│   ├── StatusBar/          # Top bar with stats & search
│   └── LogPanel/           # Transaction & activity logs
├── services/
│   ├── tonClient.js        # TonClient (TonCenter jsonRPC + API key)
│   ├── tonapi.js           # Data layer (TonCenter v2/v3 REST)
│   ├── stonfi.js           # STON.fi swap builder (SDK + API discovery)
│   ├── dedust.js           # DeDust swap builder (manual cell construction)
│   ├── txSigner.js         # Transaction signing & broadcasting
│   └── walletManager.js    # Wallet CRUD + key derivation
└── utils/
    ├── storage.js          # localStorage persistence
    └── format.js           # Number/address formatting helpers
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Blockchain** | `@ton/ton`, `@ton/core`, `@ton/crypto` |
| **STON.fi** | `@ston-fi/sdk`, `@ston-fi/api` |
| **DeDust** | `@dedust/sdk` |
| **RPC** | TonCenter API v2/v3 + API Key |
| **Icons** | Font Awesome 6 |
| **Storage** | localStorage (no server required) |

---

## 🔐 Security Notes

- **Private keys are stored in localStorage** (plaintext). This tool is designed for personal/development use.
- **No server-side storage** — all data stays in your browser.
- Never share your browser's localStorage data.
- For production trading, consider using hardware wallets or encrypted storage.

---

## 📋 Supported Tokens

Any **Jetton** (TRC-20) token on the TON mainnet is supported. Simply paste the token's contract address into the Token field.

**Tested with:**
- `EQAuco5ZEPgB19fSTo7EmtLTJysrKxbu6M_XOFDwWQiNjCsQ` — WIF (STON.fi)
- `EQD4P32U10snNoIavoq6cYPTQR82ewAjO20epigrWRAup54_` — HYDRA (DeDust)

---

## 🛣️ Roadmap

- [ ] Jetton-to-TON sell via DeDust (Jetton transfer flow)
- [ ] Batch swap progress bar with per-wallet status
- [ ] Emergency stop for batch operations
- [ ] Price impact warnings
- [ ] Multi-chain support (planned)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- [TON Blockchain](https://ton.org)
- [STON.fi DEX](https://ston.fi)
- [DeDust DEX](https://dedust.io)
- [TonCenter API](https://toncenter.com)
- [Tonscan Explorer](https://tonscan.org)

---

<p align="center">
  <strong>Built with ❤️ for the TON ecosystem</strong>
</p>

<!-- SEO Keywords: TON wallet, TON trading bot, TON multi-wallet, TON swap tool, STON.fi SDK, DeDust SDK, TON DEX trading, TON batch swap, TON market maker, TON jetton swap, TON token trading, TON blockchain tool, TON wallet manager, multi-wallet TON, TON DeFi tool -->
