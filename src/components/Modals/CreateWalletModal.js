'use client';

import { useState } from 'react';
import { createBatchWallets } from '@/services/walletManager';

export default function CreateWalletModal({ onClose, onCreated, pushLog }) {
  const [count, setCount] = useState(1);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (count < 1 || count > 50) return;
    setCreating(true);
    try {
      const wallets = await createBatchWallets(count);
      onCreated(wallets);
      pushLog({ action: 'info', wallet: '-', detail: `Created ${count} wallet(s)` });
      onClose();
    } catch (e) {
      alert('Create failed: ' + e.message);
    }
    setCreating(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Create Wallets</span>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Number of wallets (1-50)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : `Create ${count} wallet(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
