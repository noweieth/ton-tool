'use client';

import { useState } from 'react';
import { importFromMnemonic } from '@/services/walletManager';
import { getWallets } from '@/utils/storage';

export default function ImportWalletModal({ onClose, onImported, pushLog }) {
  const [mnemonic, setMnemonic] = useState('');
  const [name, setName] = useState(`Wallet ${getWallets().length}`);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setError('');
    setImporting(true);
    try {
      const wallets = await importFromMnemonic(name, mnemonic);
      onImported(wallets);
      pushLog({ action: 'info', wallet: '-', detail: `Imported wallet: ${name}` });
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setImporting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Import Wallet</span>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Wallet Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mnemonic (24 words, separated by spaces)</label>
            <textarea
              className="input input-mono"
              rows={4}
              placeholder="word1 word2 word3 ... word24"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: 11, marginTop: 4 }}>{error}</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
