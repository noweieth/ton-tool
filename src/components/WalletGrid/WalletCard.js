'use client';

import { useState } from 'react';
import { truncateAddress, formatTON, formatToken, copyToClipboard } from '@/utils/format';
import { removeWallet, renameWallet } from '@/services/walletManager';

export default function WalletCard({
  wallet, index, balance, tokenBalance, selectedToken,
  onSwap, onTransfer, onRefreshWallet, onWalletsChanged, pushLog,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(wallet.name);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshWallet(index);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  };

  const handleCopyAddress = () => {
    copyToClipboard(wallet.address);
    pushLog({ action: 'info', wallet: `#${index}`, detail: 'Address copied' });
  };

  const handleCopyPrivateKey = () => {
    copyToClipboard(wallet.secretKey);
    pushLog({ action: 'info', wallet: `#${index}`, detail: 'Private key copied' });
    setShowMenu(false);
  };

  const handleCopyMnemonic = () => {
    const words = Array.isArray(wallet.mnemonic) ? wallet.mnemonic.join(' ') : wallet.mnemonic;
    copyToClipboard(words);
    pushLog({ action: 'info', wallet: `#${index}`, detail: 'Mnemonic copied' });
    setShowMenu(false);
  };

  const handleRename = () => {
    const updated = renameWallet(index, editName);
    onWalletsChanged(updated);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${wallet.name}?`)) return;
    const updated = removeWallet(index);
    onWalletsChanged(updated);
    pushLog({ action: 'info', wallet: `#${index}`, detail: `Deleted ${wallet.name}` });
    setShowMenu(false);
  };

  return (
    <div className="wallet-card">
      {/* Header: index + name + menu */}
      <div className="wallet-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="wallet-card-index">#{index}</span>
          {editing ? (
            <input
              className="input"
              style={{ width: 120, height: 24, fontSize: 13 }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          ) : (
            <span className="wallet-card-name" onDoubleClick={() => setEditing(true)}>
              {wallet.name}
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-icon" onClick={() => setShowMenu(!showMenu)}><i className="fa-solid fa-ellipsis" /></button>
          {showMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setShowMenu(false)}
              />
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setEditing(true); setShowMenu(false); }}>
                  <i className="fa-solid fa-pen" style={{ marginRight: 6 }} /> Rename
                </button>
                <button className="dropdown-item" onClick={handleCopyMnemonic}>
                  <i className="fa-solid fa-copy" style={{ marginRight: 6 }} /> Copy Mnemonic
                </button>
                <button className="dropdown-item" onClick={handleCopyPrivateKey}>
                  <i className="fa-solid fa-key" style={{ marginRight: 6 }} /> Copy Private Key
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleDelete}>
                  <i className="fa-solid fa-trash" style={{ marginRight: 6 }} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="wallet-card-address" onClick={handleCopyAddress} title="Click to copy address">
        {truncateAddress(wallet.address, 8, 6)}
        <span className="copy-icon"><i className="fa-regular fa-copy" /></span>
      </div>

      {/* Balances */}
      <div className="wallet-card-balances">
        <span className="balance-ton">{formatTON(balance)} TON</span>
        {selectedToken && tokenBalance && (() => {
          const bal = parseFloat(tokenBalance.balance) || 0;
          const supply = parseFloat(selectedToken.totalSupply) || 0;
          const pct = supply > 0 ? ((bal / supply) * 100) : 0;
          const pctStr = pct > 0 ? (pct < 0.001 ? '<0.001' : pct.toFixed(3)) : '0';
          return (
            <span className="balance-token">
              {formatToken(tokenBalance.balance, tokenBalance.decimals)} {selectedToken.symbol}
              <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 4 }}>
                ({pctStr}%)
              </span>
            </span>
          );
        })()}
      </div>

      {/* Actions */}
      <div className="wallet-card-actions">
        <button className="btn btn-buy" onClick={() => onSwap(index, 'buy')}>Buy</button>
        <button className="btn btn-sell" onClick={() => onSwap(index, 'sell')}>Sell</button>
        <button className="btn" onClick={() => onTransfer(index)} title="Transfer"><i className="fa-solid fa-paper-plane" /></button>
        <button className="btn" onClick={handleRefresh} title="Refresh balance" disabled={refreshing}>
          <i className={`fa-solid fa-rotate${refreshing ? ' fa-spin' : ''}`} />
        </button>
        <button className="btn" onClick={handleCopyAddress} title="Copy address"><i className="fa-regular fa-copy" /></button>
        <button className="btn" onClick={handleCopyPrivateKey} title="Copy private key"><i className="fa-solid fa-key" /></button>
        <button className="btn" onClick={() => {
          window.open(`https://tonscan.org/address/${wallet.address}`, '_blank');
        }} title="View on Tonscan"><i className="fa-solid fa-arrow-up-right-from-square" /></button>
      </div>
    </div>
  );
}
