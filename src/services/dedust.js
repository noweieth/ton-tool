import { TonClient4 } from '@ton/ton';
import { Address, toNano, beginCell } from '@ton/core';
import { Factory, MAINNET_FACTORY_ADDR, Asset, PoolType } from '@dedust/sdk';
import { withRetry } from './tonClient';

let client4Instance = null;
async function getClient4() {
  if (!client4Instance) {
    try {
      const { getHttpV4Endpoint } = await import('@orbs-network/ton-access');
      const endpoint = await getHttpV4Endpoint();
      client4Instance = new TonClient4({ endpoint });
    } catch {
      // Fallback to tonhub
      client4Instance = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });
    }
  }
  return client4Instance;
}

// VaultNative swap opcode
const SWAP_OP = 0xea06185d;

function buildSwapParamsRef() {
  return beginCell()
    .storeUint(0, 32)        // deadline (0 = none)
    .storeAddress(null)      // recipientAddress
    .storeAddress(null)      // referralAddress
    .storeMaybeRef(null)     // fulfillPayload
    .storeMaybeRef(null)     // rejectPayload
    .endCell();
}

/**
 * Try to find pool: VOLATILE first, then STABLE
 */
async function findPool(factory, client, TON, JETTON) {
  const errors = [];
  for (const type of [PoolType.VOLATILE, PoolType.STABLE]) {
    try {
      const pool = client.open(await factory.getPool(type, [TON, JETTON]));
      const status = await pool.getReadinessStatus();
      if (status === 'ready') return pool;
      errors.push(`${type === PoolType.VOLATILE ? 'VOLATILE' : 'STABLE'}: ${status}`);
    } catch (e) {
      errors.push(`${type === PoolType.VOLATILE ? 'VOLATILE' : 'STABLE'}: ${e.message}`);
    }
  }
  throw new Error(`DeDust pool not ready (${errors.join(', ')}). Ensure LP is added and try again.`);
}

/**
 * Build swap TON → Jetton via DeDust
 */
export async function buildSwapTonToJetton({ jettonAddress, amountNano }) {
  return withRetry(async () => {
    const client = await getClient4();
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const TON = Asset.native();
    const JETTON = Asset.jetton(Address.parse(jettonAddress));

    const pool = await findPool(factory, client, TON, JETTON);

    const tonVault = client.open(await factory.getNativeVault());

    const amount = BigInt(amountNano);

    // Get estimated output for display
    let estimatedOut = '0';
    try {
      const est = await pool.getEstimatedSwapOut({ assetIn: TON, amountIn: amount });
      estimatedOut = est.amountOut.toString();
    } catch {}

    // Build body matching VaultNative.sendSwap exactly
    const swapBody = beginCell()
      .storeUint(SWAP_OP, 32)
      .storeUint(0, 64)              // query_id
      .storeCoins(amount)            // amount
      .storeAddress(pool.address)    // pool_address
      .storeUint(0, 1)              // reserved
      .storeCoins(0n)               // limit (0 = no min output)
      .storeMaybeRef(null)          // next step (none)
      .storeRef(buildSwapParamsRef()) // swap_params (REQUIRED ref)
      .endCell();

    return {
      to: tonVault.address.toString(),
      value: amount + toNano('0.2'),  // amount + gas
      body: swapBody,
      quote: { estimatedOut },
    };
  });
}

/**
 * Build swap Jetton → TON via DeDust
 * Flow: User sends jetton transfer to their own jetton wallet,
 * with destination=jettonVault and forward_payload=swap params
 */
export async function buildSwapJettonToTon({ jettonAddress, amountRaw, userWalletAddress }) {
  return withRetry(async () => {
    const client = await getClient4();
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const TON = Asset.native();
    const JETTON = Asset.jetton(Address.parse(jettonAddress));

    const pool = await findPool(factory, client, TON, JETTON);

    const jettonVault = client.open(await factory.getJettonVault(Address.parse(jettonAddress)));

    // Use SDK's VaultJetton to build the swap forward_payload
    const { VaultJetton } = await import('@dedust/sdk');
    const swapPayload = VaultJetton.createSwapPayload({
      poolAddress: pool.address,
      limit: 0n,
      swapParams: {},
    });

    // Resolve user's jetton wallet address via TonCenter
    const { getJettonBalances } = await import('./tonapi');
    const { Address: TonAddress } = await import('@ton/core');
    const jettons = await getJettonBalances(userWalletAddress);

    // Normalize jettonAddress for comparison
    const normalJetton = TonAddress.parse(jettonAddress).toString();
    const found = jettons.find(j => j.address === normalJetton);
    if (!found?.walletAddress) {
      throw new Error('Jetton wallet not found. You may not hold this token.');
    }

    // Build TEP-74 jetton transfer to vault via user's jetton wallet
    const jettonTransferBody = beginCell()
      .storeUint(0xf8a7ea5, 32)                    // transfer op
      .storeUint(0, 64)                             // query_id
      .storeCoins(BigInt(amountRaw))                // jetton amount
      .storeAddress(jettonVault.address)             // destination (vault)
      .storeAddress(Address.parse(userWalletAddress)) // response_destination
      .storeBit(0)                                   // no custom_payload
      .storeCoins(toNano('0.25'))                    // forward_ton_amount
      .storeBit(1)                                   // forward_payload present
      .storeRef(swapPayload)                         // forward_payload as ref
      .endCell();

    return {
      to: found.walletAddress,           // user's jetton wallet (NOT the vault)
      value: toNano('0.3'),              // gas for the whole flow
      body: jettonTransferBody,
    };
  });
}

