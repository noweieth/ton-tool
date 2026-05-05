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
import { getWallets } from '@/utils/storage';
import { getBatchBalances, getBatchJettonBalance } from '@/services/tonapi';
import { getSelectedToken, setSelectedToken, getLogs, addLog } from '@/utils/storage';

export default function Home() {
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [tokenBalances, setTokenBalances] = useState({});
  const [selectedToken, setToken] = useState(null);
  const [logs, setLogsState] = useState([]);
  const [modal, setModal] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Load wallets from localStorage
  useEffect(() => {
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

  // Filter wallets
  const filteredWallets = wallets.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q);
  });

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
    </div>
  );
}
