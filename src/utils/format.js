export function truncateAddress(addr, start = 6, end = 4) {
  if (!addr) return '';
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

export function formatTON(nanotons) {
  if (!nanotons) return '0';
  const val = Number(nanotons) / 1e9;
  if (val === 0) return '0';
  if (val < 0.001) return '<0.001';
  return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function formatToken(amount, decimals = 9) {
  if (!amount) return '0';
  const val = Number(amount) / Math.pow(10, decimals);
  if (val === 0) return '0';
  if (val < 0.0001) return '<0.0001';
  return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function formatUSD(value) {
  if (!value && value !== 0) return '-';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}
