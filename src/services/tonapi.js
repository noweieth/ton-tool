import { getSettings } from '@/utils/storage';
import { Address } from '@ton/core';

function getApiKey() {
  if (typeof window === 'undefined') return '';
  return getSettings().toncenterApiKey || '';
}

function normalizeAddress(addr) {
  try { return Address.parse(addr).toString(); } catch { return addr; }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function apiGet(url, retries = 2) {
  const apiKey = getApiKey();
  for (let i = 0; i <= retries; i++) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    const res = await fetch(url, { headers });
    if (res.status === 429) {
      await delay(1000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`TonCenter ${res.status}: ${res.statusText}`);
    return res.json();
  }
  throw new Error('TonCenter rate limited');
}

// v2 for simple balance
export async function getAccountBalance(address) {
  const data = await apiGet(`https://toncenter.com/api/v2/getAddressBalance?address=${address}`);
  return data.result || '0';
}

// v3 for jetton wallets (v2 doesn't support this)
export async function getJettonBalances(address) {
  const data = await apiGet(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${address}&limit=50`);
  const wallets = data.jetton_wallets || [];
  return wallets.map(w => ({
    address: normalizeAddress(w.jetton || ''),
    name: '',
    symbol: '',
    decimals: 9,
    image: '',
    balance: w.balance || '0',
    walletAddress: normalizeAddress(w.address || ''),
  }));
}

// v3 for jetton metadata, fallback to tonapi.io
export async function getJettonInfo(jettonAddress) {
  try {
    const data = await apiGet(`https://toncenter.com/api/v3/jetton/masters?address=${jettonAddress}&limit=1`);
    const master = (data.jetton_masters || [])[0];
    if (master) {
      const content = master.jetton_content || {};
      return {
        address: jettonAddress,
        name: content.name || 'Unknown',
        symbol: content.symbol || '?',
        decimals: parseInt(content.decimals) || 9,
        image: content.image || content.uri || '',
        totalSupply: master.total_supply || '0',
      };
    }
  } catch {}
  // Fallback: tonapi.io
  try {
    const res = await fetch(`https://tonapi.io/v2/jettons/${jettonAddress}`);
    if (res.ok) {
      const d = await res.json();
      return {
        address: jettonAddress,
        name: d.metadata?.name || 'Unknown',
        symbol: d.metadata?.symbol || '?',
        decimals: d.metadata?.decimals || 9,
        image: d.metadata?.image || '',
        totalSupply: d.total_supply || '0',
      };
    }
  } catch {}
  return { address: jettonAddress, name: 'Unknown', symbol: '?', decimals: 9, image: '', totalSupply: '0' };
}

export async function getBatchBalances(addresses) {
  const apiKey = getApiKey();
  const BATCH_SIZE = apiKey ? 10 : 3;
  const map = {};
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(addr => getAccountBalance(addr))
    );
    results.forEach((r, j) => {
      map[batch[j]] = r.status === 'fulfilled' ? r.value : '0';
    });
    if (i + BATCH_SIZE < addresses.length) await delay(apiKey ? 100 : 500);
  }
  return map;
}

export async function getBatchJettonBalance(addresses, jettonAddress) {
  const apiKey = getApiKey();
  const BATCH_SIZE = apiKey ? 10 : 3;
  const map = {};
  const normalJetton = normalizeAddress(jettonAddress);
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (addr) => {
        const jettons = await getJettonBalances(addr);
        const found = jettons.find(j => j.address === normalJetton);
        return { balance: found?.balance || '0', decimals: found?.decimals || 9 };
      })
    );
    results.forEach((r, j) => {
      map[batch[j]] = r.status === 'fulfilled'
        ? { balance: r.value.balance, decimals: r.value.decimals }
        : { balance: '0', decimals: 9 };
    });
    if (i + BATCH_SIZE < addresses.length) await delay(apiKey ? 100 : 500);
  }
  return map;
}
