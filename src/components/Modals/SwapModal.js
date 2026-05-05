'use client';

import { useState } from 'react';
import { formatTON, formatToken } from '@/utils/format';

export default function SwapModal({
  wallet, walletIndex, action, selectedToken,
  balance, tokenBalance, onClose, pushLog, onComplete,
}) {
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [dex, setDex] = useState(selectedToken?.dex || 'stonfi');
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [dedustPool, setDedustPool] = useState(selectedToken?.poolAddress || '');

  const isBuy = action === 'buy';

  const handleMax = () => {
    if (isBuy) {
      const maxTon = Math.max(0, Number(balance) / 1e9 - 0.15);
      setAmount(maxTon.toFixed(4));
    } else {
      const dec = selectedToken?.decimals || 9;
      const maxToken = Number(tokenBalance?.balance || 0) / Math.pow(10, dec);
      setAmount(maxToken.toFixed(4));
    }
  };

  const handleExecute = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!selectedToken) {
      setError('Select a token first');
      return;
    }

    setExecuting(true);
    setError('');
    setStatus('Building transaction...');

    try {
      const { signAndSend } = await import('@/services/txSigner');

      let txParams;

      if (dex === 'stonfi') {
        setStatus('Building STON.fi swap...');
        const stonfi = await import('@/services/stonfi');
        const slippageFraction = (parseFloat(slippage) / 100).toString();

        if (isBuy) {
          const offerAmount = Math.floor(parseFloat(amount) * 1e9).toString();
          txParams = await stonfi.buildSwapTonToJetton({
            jettonAddress: selectedToken.address,
            offerAmount,
            slippage: slippageFraction,
            userWalletAddress: wallet.address,
          });
        } else {
          const dec = selectedToken.decimals || 9;
          const offerAmount = Math.floor(parseFloat(amount) * Math.pow(10, dec)).toString();
          txParams = await stonfi.buildSwapJettonToTon({
            jettonAddress: selectedToken.address,
            offerAmount,
            slippage: slippageFraction,
            userWalletAddress: wallet.address,
          });
        }
      } else {
        setStatus('Building DeDust swap...');
        const dedust = await import('@/services/dedust');

        if (isBuy) {
          const amountNano = Math.floor(parseFloat(amount) * 1e9).toString();
          txParams = await dedust.buildSwapTonToJetton({
            jettonAddress: selectedToken.address,
            amountNano,
            userWalletAddress: wallet.address,
            poolAddress: dedustPool.trim() || undefined,
          });
        } else {
          const dec = selectedToken.decimals || 9;
          const amountRaw = Math.floor(parseFloat(amount) * Math.pow(10, dec)).toString();
          txParams = await dedust.buildSwapJettonToTon({
            jettonAddress: selectedToken.address,
            amountRaw,
            userWalletAddress: wallet.address,
            poolAddress: dedustPool.trim() || undefined,
          });
        }
      }

      setStatus('Signing & broadcasting...');
      await signAndSend(wallet, [{
        to: txParams.to,
        value: txParams.value,
        body: txParams.body || undefined,
      }]);

      setStatus('Transaction sent!');
      pushLog({
        action: isBuy ? 'buy' : 'sell',
        wallet: `#${walletIndex}`,
        detail: `${isBuy ? 'Buy' : 'Sell'} ${amount} ${isBuy ? 'TON' : selectedToken.symbol} via ${dex}`,
      });

      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Swap error:', e);
      setError(`Failed: ${e.message}`);
      setStatus('');
    }
    setExecuting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {isBuy ? <><i className="fa-solid fa-circle" style={{ fontSize: 8, marginRight: 6 }} /> BUY</> : <><i className="fa-solid fa-circle" style={{ fontSize: 8, marginRight: 6 }} /> SELL</>} — {wallet?.name}
          </span>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">
          {!selectedToken ? (
            <div style={{ color: 'var(--accent-yellow)', fontSize: 13 }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }} /> Select a token in the sidebar before swapping
            </div>
          ) : (
            <>
              {/* Balance Info */}
              <div className="form-group">
                <label className="form-label">
                  {isBuy
                    ? `From: TON — Balance: ${formatTON(balance)} TON`
                    : `From: ${selectedToken.symbol} — Balance: ${formatToken(tokenBalance?.balance, tokenBalance?.decimals)}`
                  }
                </label>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">
                  Amount ({isBuy ? 'TON' : selectedToken.symbol})
                </label>

                {/* % Balance Selector (sell only) */}
                {!isBuy && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                    {[25, 50, 75, 100].map(pct => {
                      const dec = selectedToken?.decimals || 9;
                      const maxToken = Number(tokenBalance?.balance || 0) / Math.pow(10, dec);
                      const val = (maxToken * pct / 100).toFixed(4);
                      return (
                        <button
                          key={pct}
                          className={`btn ${amount === val ? 'btn-primary' : ''}`}
                          onClick={() => setAmount(val)}
                          style={{ flex: 1, minWidth: 50, fontSize: 11, padding: '4px 6px' }}
                        >{pct}%</button>
                      );
                    })}
                    <div style={{ position: 'relative', flex: 1, minWidth: 70 }}>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="%"
                        style={{ fontSize: 11, padding: '4px 6px', width: '100%', textAlign: 'center' }}
                        onChange={(e) => {
                          const pct = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          const dec = selectedToken?.decimals || 9;
                          const maxToken = Number(tokenBalance?.balance || 0) / Math.pow(10, dec);
                          setAmount((maxToken * pct / 100).toFixed(4));
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <input
                    className="input input-mono"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <button className="btn" onClick={handleMax}>MAX</button>
                </div>
              </div>

              {/* Slippage */}
              <div className="form-group">
                <label className="form-label">Slippage %</label>
                <div className="form-row">
                  {['0.5', '1', '3', '5', '10'].map(s => (
                    <button
                      key={s}
                      className={`btn ${slippage === s ? 'btn-primary' : ''}`}
                      onClick={() => setSlippage(s)}
                    >{s}%</button>
                  ))}
                  <input
                    className="input"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    placeholder="Custom"
                    style={{ width: 72, textAlign: 'center', fontSize: 12 }}
                    value={!['0.5', '1', '3', '5', '10'].includes(slippage) ? slippage : ''}
                    onChange={(e) => setSlippage(e.target.value || '1')}
                  />
                </div>
              </div>

              {/* Status */}
              {status && (
                <div style={{
                  padding: 10, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  color: status.includes('sent') ? 'var(--accent-green)' : 'var(--accent-yellow)',
                }}>
                  {status}
                </div>
              )}

              {error && (
                <div style={{
                  color: 'var(--accent-red)', fontSize: 13,
                  marginTop: 8, padding: 8,
                  background: 'rgba(255,68,68,0.05)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }} /> {error}
                </div>
              )}
            </>
          )}
        </div>
        {selectedToken && (
          <div className="modal-footer">
            <button className="btn" onClick={onClose} disabled={executing}>Cancel</button>
            <button
              className={`btn ${isBuy ? 'btn-buy' : 'btn-sell'}`}
              style={{ fontWeight: 600, padding: '8px 20px' }}
              onClick={handleExecute}
              disabled={executing || !amount}
            >
              {executing ? 'Processing...' : (isBuy ? 'BUY' : 'SELL')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
