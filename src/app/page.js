'use client';

import { useState, useEffect, useCallback } from 'react';
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') window.Buffer = Buffer;

import Sidebar from '@/components/Sidebar/Sidebar';
import StatusBar from '@/components/StatusBar/StatusBar';
import WalletGrid from '@/components/WalletGrid/WalletGrid';
import LogPanel from '@/components/LogPanel/LogPanel';
import CreateWalletModal from '@/components/Modals/CreateWalletModal';
import ImportWalletModal from '@/components/Modals/ImportWalletModal';
import SwapModal from '@/components/Modals/SwapModal';
import TransferModal from '@/components/Modals/TransferModal';
import { getWallets } from '@/utils/storage';
import { getBatchBalances, getBatchJettonBalance } from '@/services/tonapi';
import { getSelectedToken, setSelectedToken, getLogs, addLog, getSettings, setSettings } from '@/utils/storage';

export default function Home() {
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [tokenBalances, setTokenBalances] = useState({});
  const [selectedToken, setToken] = useState(null);
  const [logs, setLogsState] = useState([]);
  const [modal, setModal] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey, setApiKey] = useState(null); // null = loading, '' = no key

  useEffect(() => {
    const settings = getSettings();
    setApiKey(settings.toncenterApiKey || '');
    setWallets(getWallets());
    setLogsState(getLogs());
    setToken(getSelectedToken());
  }, []);

  // Fetch balances
  const refreshBalances = useCallback(async () => {
    if (wallets.length === 0) return;
    setLoading(true);
    try {
      const addresses = wallets.map(w => w.address);
      const bals = await getBatchBalances(addresses);
      setBalances(bals);

      if (selectedToken) {
        const tBals = await getBatchJettonBalance(addresses, selectedToken.address);
        setTokenBalances(tBals);
      }
    } catch (e) {
      console.error('Failed to refresh balances:', e);
    }
    setLoading(false);
  }, [wallets, selectedToken]);

  useEffect(() => {
    refreshBalances();
    const interval = setInterval(refreshBalances, 30000);
    return () => clearInterval(interval);
  }, [refreshBalances]);

  const handleWalletsChanged = useCallback((newWallets) => {
    setWallets([...newWallets]);
  }, []);

  const handleTokenChange = useCallback((token) => {
    setToken(token);
    setSelectedToken(token);
    setTokenBalances({});
  }, []);

  const pushLog = useCallback((entry) => {
    const newLogs = addLog(entry);
    setLogsState([...newLogs]);
  }, []);

  const handleSwap = useCallback((walletIndex, action) => {
    setSwapTarget({ walletIndex, action });
    setModal('swap');
  }, []);

  const handleTransfer = useCallback((walletIndex) => {
    setTransferTarget({ walletIndex });
    setModal('transfer');
  }, []);

  // Filter wallets
  const filteredWallets = wallets.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q);
  });

  const handleSaveSetupKey = (key) => {
    const settings = getSettings();
    settings.toncenterApiKey = key;
    setSettings(settings);
    setApiKey(key);
  };

  // Loading state
  if (apiKey === null) return null;

  // Setup screen - mandatory API key
  if (!apiKey) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 20,
      }}>
        <div style={{
          maxWidth: 460,
          width: '100%',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border-color)',
          padding: 32,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <i className="fa-solid fa-gem" style={{ fontSize: 36, color: 'var(--accent-blue)', marginBottom: 12, display: 'block' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              TON Tool
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Multi-Wallet Trading Terminal
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              <i className="fa-solid fa-key" style={{ marginRight: 8, color: 'var(--accent-yellow)' }} />
              TonCenter API Key Required
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: 'var(--accent-blue)' }}>1.</strong> Open Telegram, search for{' '}
                <a href="https://t.me/tonapibot" target="_blank" rel="noopener"
                   style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>@tonapibot</a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: 'var(--accent-blue)' }}>2.</strong> Press <strong>/start</strong> → select <strong>Manage API Keys</strong>
              </div>
              <div>
                <strong style={{ color: 'var(--accent-blue)' }}>3.</strong> Create new key → select <strong>mainnet</strong> → copy key
              </div>
            </div>
          </div>

          <input
            className="input input-mono"
            placeholder="Paste your TonCenter API key here..."
            style={{ marginBottom: 12, fontSize: 13 }}
            onPaste={(e) => {
              setTimeout(() => handleSaveSetupKey(e.target.value.trim()), 0);
            }}
            onChange={(e) => {
              if (e.target.value.trim().length >= 60) {
                handleSaveSetupKey(e.target.value.trim());
              }
            }}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
            <i className="fa-solid fa-lock" style={{ marginRight: 4 }} />
            Key is stored locally in your browser. Never shared.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        selectedToken={selectedToken}
        onTokenChange={handleTokenChange}
        onCreateWallet={() => setModal('create')}
        onImportWallet={() => setModal('import')}
        onRefresh={refreshBalances}
        wallets={wallets}
        onWalletsChanged={handleWalletsChanged}
        pushLog={pushLog}
        onSwap={handleSwap}
      />
      <div className="main-content">
        <StatusBar
          wallets={wallets}
          balances={balances}
          tokenBalances={tokenBalances}
          selectedToken={selectedToken}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={refreshBalances}
        />
        <WalletGrid
          wallets={filteredWallets}
          allWallets={wallets}
          balances={balances}
          tokenBalances={tokenBalances}
          selectedToken={selectedToken}
          viewMode={viewMode}
          onSwap={handleSwap}
          onTransfer={handleTransfer}
          onWalletsChanged={handleWalletsChanged}
          pushLog={pushLog}
        />
        <LogPanel logs={logs} />
      </div>

      {modal === 'create' && (
        <CreateWalletModal
          onClose={() => setModal(null)}
          onCreated={handleWalletsChanged}
          pushLog={pushLog}
        />
      )}
      {modal === 'import' && (
        <ImportWalletModal
          onClose={() => setModal(null)}
          onImported={handleWalletsChanged}
          pushLog={pushLog}
        />
      )}
      {modal === 'swap' && swapTarget && (
        <SwapModal
          wallet={wallets[swapTarget.walletIndex]}
          walletIndex={swapTarget.walletIndex}
          action={swapTarget.action}
          selectedToken={selectedToken}
          balance={balances[wallets[swapTarget.walletIndex]?.address] || '0'}
          tokenBalance={tokenBalances[wallets[swapTarget.walletIndex]?.address] || { balance: '0', decimals: 9 }}
          onClose={() => { setModal(null); setSwapTarget(null); }}
          pushLog={pushLog}
          onComplete={refreshBalances}
        />
      )}
      {modal === 'transfer' && transferTarget && (
        <TransferModal
          wallet={wallets[transferTarget.walletIndex]}
          walletIndex={transferTarget.walletIndex}
          selectedToken={selectedToken}
          balance={balances[wallets[transferTarget.walletIndex]?.address] || '0'}
          tokenBalance={tokenBalances[wallets[transferTarget.walletIndex]?.address] || { balance: '0', decimals: 9 }}
          onClose={() => { setModal(null); setTransferTarget(null); }}
          pushLog={pushLog}
          onComplete={refreshBalances}
        />
      )}
    </div>
  );
}
