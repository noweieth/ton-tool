'use client';

import { formatTON, formatToken } from '@/utils/format';

export default function StatusBar({
  wallets, balances, tokenBalances, selectedToken, loading,
  searchQuery, onSearchChange, viewMode, onViewModeChange, onRefresh,
}) {
  const totalTON = Object.values(balances).reduce((sum, b) => sum + Number(b || 0), 0);
  const totalToken = selectedToken
    ? Object.values(tokenBalances).reduce((sum, b) => sum + Number(b?.balance || 0), 0)
    : 0;

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="dot" />
        <span className="value">{formatTON(totalTON)}</span>
        <span>TON</span>
      </div>
      {selectedToken && (
        <div className="status-item">
          <span className="dot" style={{ background: 'var(--accent-green)' }} />
          <span className="value">{formatToken(totalToken, selectedToken.decimals || 9)}</span>
          <span>{selectedToken.symbol}</span>
        </div>
      )}
      <div className="status-item">
        <span>→</span>
        <span className="value">[{wallets.length}]</span>
        <span>WALLETS</span>
      </div>
      {loading && (
        <div className="status-item">
          <span style={{ color: 'var(--accent-yellow)' }}>⟳</span>
        </div>
      )}

      <div className="status-bar-right">
        <input
          className="input"
          style={{ width: 200, height: 32 }}
          placeholder="Search wallets..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className="btn" onClick={onRefresh} title="Refresh"><i className="fa-solid fa-rotate" /></button>
        <button
          className="btn"
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'List view' : 'Grid view'}
        >
          {viewMode === 'grid' ? <i className="fa-solid fa-list" /> : <i className="fa-solid fa-grip" />}
        </button>
      </div>
    </div>
  );
}
