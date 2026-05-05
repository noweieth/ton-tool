'use client';

import { useState, useEffect } from 'react';
import { exportWallets, importWalletsFromJSON } from '@/services/walletManager';
import { getWallets, setWallets, getSettings, setSettings } from '@/utils/storage';

export default function Sidebar({
  selectedToken, onTokenChange, onCreateWallet, onImportWallet,
  onRefresh, wallets, onWalletsChanged, pushLog, onSwap,
}) {
  const [tokenInput, setTokenInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setApiKey(getSettings().toncenterApiKey || '');
  }, []);

  const handleSaveApiKey = (val) => {
    setApiKey(val);
    const s = getSettings();
    setSettings({ ...s, toncenterApiKey: val.trim() });
  };

  const handleAddToken = () => {
    const addr = tokenInput.trim();
    if (!addr) return;
    onTokenChange({ address: addr, symbol: '...', name: 'Loading', decimals: 9 });
    setTokenInput('');
    import('@/services/tonapi').then(({ getJettonInfo }) => {
      getJettonInfo(addr).then(info => {
        onTokenChange({ ...info, address: addr });
      }).catch(() => {});
    });
  };

  const handleExport = () => {
    const data = exportWallets();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ton-wallets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushLog({ action: 'info', wallet: '-', detail: 'Exported wallets' });
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = importWalletsFromJSON(text);
        onWalletsChanged(data);
        pushLog({ action: 'info', wallet: '-', detail: `Imported ${data.length} wallets` });
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (!confirm('Delete ALL wallets? This action cannot be undone!')) return;
    setWallets([]);
    onWalletsChanged([]);
    pushLog({ action: 'info', wallet: '-', detail: 'Cleared all wallets' });
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <i className="fa-solid fa-gem" style={{ color: 'var(--accent-blue)' }} /> TON Tool
      </div>

      {/* Token Selector */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Token</div>
        {selectedToken ? (
          <div className="token-info">
            <span className="symbol">{selectedToken.symbol}</span>
            <span className="addr">{selectedToken.address?.slice(0, 12)}...</span>
            <button
              className="btn btn-sm"
              onClick={() => onTokenChange(null)}
              style={{ marginLeft: 'auto' }}
            ><i className="fa-solid fa-xmark" /></button>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>[no token selected]</span>
        )}
        <div style={{ marginTop: 6 }}>
          <input
            className="input input-mono"
            placeholder="Paste token address..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddToken()}
          />
        </div>
      </div>

      {/* Wallet Manager */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Wallet Manager</div>
        <div className="icon-bar">
          <button className="btn btn-icon" onClick={onCreateWallet} title="Create wallets"><i className="fa-solid fa-plus" /></button>
          <button className="btn btn-icon" onClick={onRefresh} title="Refresh balances"><i className="fa-solid fa-rotate" /></button>
          <button className="btn btn-icon" onClick={onImportWallet} title="Import wallet"><i className="fa-solid fa-download" /></button>
          <button className="btn btn-icon" onClick={handleExport} title="Export wallets"><i className="fa-solid fa-upload" /></button>
          <button className="btn btn-icon" onClick={handleImportJSON} title="Import JSON"><i className="fa-solid fa-file-import" /></button>
          <button className="btn btn-icon" onClick={handleClearAll} title="Clear all"><i className="fa-solid fa-trash" /></button>
        </div>
      </div>

      {/* Trading Tools */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          Trading Tools
          {selectedToken && <span style={{ color: 'var(--accent-green)' }}>●</span>}
        </div>
        <button className="tool-btn" onClick={() => {
          if (!selectedToken) return alert('Select a token first');
          wallets.forEach((_, i) => onSwap(i, 'buy'));
        }}>
          <i className="fa-solid fa-cart-shopping" style={{ marginRight: 6 }} /> Multi Buy
        </button>
        <button className="tool-btn" onClick={() => {
          if (!selectedToken) return alert('Select a token first');
          wallets.forEach((_, i) => onSwap(i, 'sell'));
        }}>
          <i className="fa-solid fa-coins" style={{ marginRight: 6 }} /> Multi Sell
        </button>
      </div>

      {/* API Key Settings */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><i className="fa-solid fa-gear" style={{ marginRight: 4 }} /> TonCenter API</span>
          <span
            style={{ fontSize: 10, cursor: 'pointer', color: apiKey ? 'var(--accent-green)' : 'var(--accent-yellow)' }}
          >
            {apiKey ? <><i className="fa-solid fa-circle" style={{ fontSize: 6 }} /> Connected</> : <><i className="fa-regular fa-circle" style={{ fontSize: 6 }} /> No Key</>}
          </span>
        </div>

        <input
          className="input input-mono"
          placeholder="Paste TonCenter API key..."
          value={apiKey}
          onChange={(e) => handleSaveApiKey(e.target.value)}
          style={{ marginBottom: 6 }}
        />

        <button
          className="btn btn-sm"
          onClick={() => setShowGuide(!showGuide)}
          style={{ width: '100%', textAlign: 'left', fontSize: 11, padding: '4px 8px' }}
        >
          <i className={`fa-solid fa-chevron-${showGuide ? 'down' : 'right'}`} style={{ fontSize: 8, marginRight: 4 }} /> How to get API Key (free)
        </button>

        {showGuide && (
          <div style={{
            marginTop: 6,
            padding: 8,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}>
            <div style={{ marginBottom: 4, fontWeight: 600, color: 'var(--text-primary)' }}>
              3 steps to get a free API Key:
            </div>
            <div>
              <strong style={{ color: 'var(--accent-blue)' }}>1.</strong> Open Telegram, search for{' '}
              <a
                href="https://t.me/tonapibot"
                target="_blank"
                rel="noopener"
                style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}
              >@tonapibot</a>
            </div>
            <div>
              <strong style={{ color: 'var(--accent-blue)' }}>2.</strong> Press <strong>/start</strong> → select <strong>Manage API Keys</strong>
            </div>
            <div>
              <strong style={{ color: 'var(--accent-blue)' }}>3.</strong> Create new key → select <strong>mainnet</strong> → copy key
            </div>
            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 10 }}>
              <i className="fa-solid fa-lightbulb" style={{ marginRight: 4 }} /> Free key = unlimited requests/s. Without key, limited to ~1 req/s.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-section" style={{ borderBottom: 'none' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-gem" style={{ marginRight: 4 }} /> TON Tool v1.0
        </div>
      </div>
    </aside>
  );
}
