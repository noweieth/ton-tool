'use client';

import { useState } from 'react';
import { formatTime } from '@/utils/format';

export default function LogPanel({ logs }) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState('logs');

  const filteredLogs = tab === 'txn'
    ? logs.filter(l => l.action === 'buy' || l.action === 'sell' || l.action === 'transfer')
    : logs;

  return (
    <div className={`log-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="log-panel-header" onClick={() => setCollapsed(!collapsed)}>
        <span
          className={`log-tab ${tab === 'logs' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setTab('logs'); setCollapsed(false); }}
        >Logs</span>
        <span
          className={`log-tab ${tab === 'txn' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setTab('txn'); setCollapsed(false); }}
        >Txn</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
          {logs.length} entries <i className={`fa-solid fa-chevron-${collapsed ? 'up' : 'down'}`} style={{ fontSize: 8, marginLeft: 4 }} />
        </span>
      </div>
      {!collapsed && (
        <div className="log-panel-body">
          {filteredLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0' }}>
              No logs yet
            </div>
          ) : (
            filteredLogs.map((log, i) => (
              <div className="log-entry" key={i}>
                <span className="log-time">{formatTime(log.time)}</span>
                <span className="log-wallet">{log.wallet}</span>
                <span className={`log-action ${log.action}`}>{log.action.toUpperCase()}</span>
                <span className="log-detail">{log.detail}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
