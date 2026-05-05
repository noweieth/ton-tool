import { TonClient } from '@ton/ton';
import { getSettings } from '@/utils/storage';

const TONCENTER_URL = 'https://toncenter.com/api/v2/jsonRPC';

let clientInstance = null;
let lastApiKey = null;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Get TonClient using TonCenter with user's API key
 * Recreates client if API key changes
 */
export function getTonClient() {
  const apiKey = (typeof window !== 'undefined') ? (getSettings().toncenterApiKey || '') : '';

  if (clientInstance && lastApiKey === apiKey) return clientInstance;

  const config = { endpoint: TONCENTER_URL };
  if (apiKey) config.apiKey = apiKey;

  clientInstance = new TonClient(config);
  lastApiKey = apiKey;
  return clientInstance;
}

/**
 * Execute a function with retry on transient errors
 */
export async function withRetry(fn, maxRetries = 4) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e.message || '';
      const isRetryable = msg.includes('429') || msg.includes('rate') || msg.includes('Too Many') || msg.includes('timeout') || msg.includes('ECONNRESET') || msg.includes('LITE_SERVER');
      if (isRetryable && i < maxRetries) {
        await delay(1500 * (i + 1));
        continue;
      }
      throw e;
    }
  }
}
