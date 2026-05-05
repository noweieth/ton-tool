'use client';

import { useState } from 'react';
import { formatTON, formatToken } from '@/utils/format';
import { sendTON, sendJetton } from '@/services/txSigner';

export default function TransferModal({
  wallet, walletIndex, selectedToken, balance, tokenBalance,
  onClose, pushLog, onComplete,
}) {
  const [mode, setMode] = useState('ton'); // 'ton' or 'jetton'
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const tonBal = formatTON(balance);
  const jettonBal = selectedToken && tokenBalance
    ? formatToken(tokenBalance.balance, tokenBalance.decimals)
    : '0';

  const handleMax = () => {
    if (mode === 'ton') {
      const max = Math.max(0, parseFloat(tonBal) - 0.05); // reserve gas
      setAmount(max > 0 ? max.toFixed(4) : '0');
    } else {
      setAmount(jettonBal);
    }
  };

  const handleExecute = async () => {
    if (!toAddress.trim()) { setError('Enter destination address'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }

    setExecuting(true);
    setError('');
    setStatus('');

    try {
      if (mode === 'ton') {
        const amountNano = Math.floor(parseFloat(amount) * 1e9).toString();
        setStatus('Sending TON...');
        await sendTON(wallet, toAddress.trim(), amountNano);
        setStatus('TON transfer sent!');
        pushLog({
          action: 'transfer',
          wallet: `#${walletIndex}`,
          detail: `Sent ${amount} TON → ${toAddress.slice(0, 8)}...`,
        });
      } else {
        if (!selectedToken) { setError('Select a token first'); setExecuting(false); return; }

        // Get user's jetton wallet address
        setStatus('Finding jetton wallet...');
        const { getJettonBalances } = await import('@/services/tonapi');
        const jettons = await getJettonBalances(wallet.address);
        const found = jettons.find(j => j.address === selectedToken.address);

        if (!found?.walletAddress) {
          setError('Jetton wallet not found. You may not hold this token.');
          setExecuting(false);
          return;
        }

        const dec = selectedToken.decimals || 9;
        const amountRaw = Math.floor(parseFloat(amount) * Math.pow(10, dec)).toString();

        setStatus('Sending jetton transfer...');
        await sendJetton(wallet, {
          jettonWalletAddress: found.walletAddress,
          toAddress: toAddress.trim(),
          amountRaw,
        });

        setStatus('Jetton transfer sent!');
        pushLog({
          action: 'transfer',
          wallet: `#${walletIndex}`,
          detail: `Sent ${amount} ${selectedToken.symbol} → ${toAddress.slice(0, 8)}...`,
        });
      }

      if (onComplete) setTimeout(onComplete, 3000);
    } catch (e) {
      console.error('Transfer error:', e);
      setError(e.message || 'Transfer failed');
    }
    setExecuting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ color: 'var(--accent-blue)' }}>
            <i className="fa-solid fa-paper-plane" style={{ fontSize: 12, marginRight: 6 }} /> TRANSFER — {wallet?.name}
          </span>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              className={`btn ${mode === 'ton' ? 'btn-buy' : ''}`}
              onClick={() => { setMode('ton'); setAmount(''); setError(''); }}
              style={{ flex: 1 }}
            >TON</button>
            <button
              className={`btn ${mode === 'jetton' ? 'btn-buy' : ''}`}
              onClick={() => { setMode('jetton'); setAmount(''); setError(''); }}
              style={{ flex: 1 }}
              disabled={!selectedToken}
            >{selectedToken?.symbol || 'Jetton'}</button>
          </div>

          {/* Balance */}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            From: {wallet?.name} — Balance:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {mode === 'ton' ? `${tonBal} TON` : `${jettonBal} ${selectedToken?.symbol || ''}`}
            </strong>
          </div>

          {/* To Address */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              Destination Address
            </label>
            <input
              className="input input-mono"
              placeholder="Enter TON address..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              Amount ({mode === 'ton' ? 'TON' : selectedToken?.symbol || 'Token'})
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={handleMax} style={{ whiteSpace: 'nowrap' }}>MAX</button>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div style={{
              padding: 10, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: status.includes('sent') ? 'var(--accent-green)' : 'var(--accent-yellow)',
              marginBottom: 8,
            }}>
              {status}
            </div>
          )}
          {error && (
            <div style={{
              padding: 8, fontSize: 12,
              color: 'var(--accent-red)',
              background: 'rgba(255,68,68,0.05)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 8,
            }}>
              <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-buy"
            onClick={handleExecute}
            disabled={executing || !amount || !toAddress}
          >
            <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
            {executing ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
