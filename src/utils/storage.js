const KEYS = {
  WALLETS: 'ton_wallets',
  LOGS: 'ton_logs',
  SETTINGS: 'ton_settings',
  TOKEN: 'ton_selected_token',
};

export function getItem(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setItem(key, value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getWallets() { return getItem(KEYS.WALLETS) || []; }
export function setWallets(wallets) { setItem(KEYS.WALLETS, wallets); }

export function getLogs() { return getItem(KEYS.LOGS) || []; }
export function setLogs(logs) { setItem(KEYS.LOGS, logs); }
export function addLog(entry) {
  const logs = getLogs();
  logs.unshift({ ...entry, time: Date.now() });
  if (logs.length > 200) logs.length = 200;
  setLogs(logs);
  return logs;
}

export function getSettings() {
  return getItem(KEYS.SETTINGS) || { slippage: 1, dex: 'stonfi', autoRefresh: 30, toncenterApiKey: '' };
}
export function setSettings(settings) { setItem(KEYS.SETTINGS, settings); }

export function getSelectedToken() { return getItem(KEYS.TOKEN) || null; }
export function setSelectedToken(token) { setItem(KEYS.TOKEN, token); }
