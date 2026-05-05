'use client';

import { useState } from 'react';
import { importFromMnemonic } from '@/services/walletManager';
import { getWallets } from '@/utils/storage';

export default function ImportWalletModal({ onClose, onImported, pushLog }) {
  const [mode, setMode] = useState('single'); // 'single' or 'multi'
  const [mnemonic, setMnemonic] = useState('');
  const [multiInput, setMultiInput] = useState('');
  const [name, setName] = useState(`Wallet ${getWallets().length}`);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleImportSingle = async () => {
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

  const handleImportMulti = async () => {
    setError('');
    setImporting(true);
    setProgress('');

    const lines = multiInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setError('No mnemonics entered');
      setImporting(false);
      return;
    }

    let imported = 0;
    let skipped = 0;
    let errors = [];
    const startIndex = getWallets().length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const walletName = `Wallet ${startIndex + imported}`;
      setProgress(`Importing ${i + 1}/${lines.length}...`);

      try {
        await importFromMnemonic(walletName, line);
        imported++;
      } catch (e) {
        if (e.message.includes('already exists')) {
          skipped++;
        } else {
          errors.push(`Line ${i + 1}: ${e.message}`);
        }
      }
    }

    setProgress('');

    if (imported > 0) {
      const all = getWallets();
      onImported(all);
      pushLog({
        action: 'info',
        wallet: '-',
        detail: `Imported ${imported} wallet(s)${skipped > 0 ? `, ${skipped} skipped (duplicate)` : ''}`,
      });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else if (imported === 0 && skipped > 0) {
      setError(`All ${skipped} wallet(s) already exist`);
    } else {
      onClose();
    }

    setImporting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">Import Wallets</span>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              className={`btn ${mode === 'single' ? 'btn-primary' : ''}`}
              onClick={() => { setMode('single'); setError(''); }}
              style={{ flex: 1 }}
            >
              <i className="fa-solid fa-wallet" style={{ marginRight: 6 }} /> Single
            </button>
            <button
              className={`btn ${mode === 'multi' ? 'btn-primary' : ''}`}
              onClick={() => { setMode('multi'); setError(''); }}
              style={{ flex: 1 }}
            >
              <i className="fa-solid fa-layer-group" style={{ marginRight: 6 }} /> Multi
            </button>
          </div>

          {mode === 'single' ? (
            <>
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
                  rows={3}
                  placeholder="word1 word2 word3 ... word24"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">
                Mnemonics (one per line, 24 words each)
              </label>
              <textarea
                className="input input-mono"
                rows={8}
                placeholder={"word1 word2 word3 ... word24\nword1 word2 word3 ... word24\nword1 word2 word3 ... word24"}
                value={multiInput}
                onChange={(e) => setMultiInput(e.target.value)}
                style={{ resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
                {multiInput.split('\n').filter(l => l.trim()).length} mnemonic(s) detected. Wallets will be auto-named.
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div style={{
              padding: 8, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)', fontSize: 12,
              color: 'var(--accent-yellow)', marginTop: 8,
            }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />
              {progress}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              color: 'var(--accent-red)', fontSize: 11, marginTop: 8,
              whiteSpace: 'pre-line', maxHeight: 100, overflow: 'auto',
            }}>
              <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }} />
              {error}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={mode === 'single' ? handleImportSingle : handleImportMulti}
            disabled={importing}
          >
            {importing ? 'Importing...' : `Import${mode === 'multi' ? ` (${multiInput.split('\n').filter(l => l.trim()).length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
