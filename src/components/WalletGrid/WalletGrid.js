'use client';

import WalletCard from './WalletCard';

export default function WalletGrid({
  wallets, allWallets, balances, tokenBalances, selectedToken,
  viewMode, onSwap, onTransfer, onRefreshWallet, onWalletsChanged, pushLog,
}) {
  if (wallets.length === 0) {
    return (
      <div className="wallet-grid-container">
        <div className="empty-state">
          <div className="icon"><i className="fa-solid fa-gem" /></div>
          <div className="title">No wallets yet</div>
          <div className="desc">Use Wallet Manager on the left to create or import wallets</div>
        </div>
      </div>
    );
  }

  // Find original index in allWallets
  const getOriginalIndex = (wallet) => allWallets.findIndex(w => w.address === wallet.address);

  return (
    <div className="wallet-grid-container">
      <div className={`wallet-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
        {wallets.map((wallet) => {
          const origIndex = getOriginalIndex(wallet);
          return (
            <WalletCard
              key={wallet.address}
              wallet={wallet}
              index={origIndex}
              balance={balances[wallet.address] || '0'}
              tokenBalance={tokenBalances[wallet.address] || null}
              selectedToken={selectedToken}
              onSwap={onSwap}
              onTransfer={onTransfer}
              onRefreshWallet={onRefreshWallet}
              onWalletsChanged={onWalletsChanged}
              pushLog={pushLog}
            />
          );
        })}
      </div>
    </div>
  );
}
