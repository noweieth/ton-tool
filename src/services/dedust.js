import { TonClient4 } from '@ton/ton';
import { Address, toNano, beginCell } from '@ton/core';
import { Factory, MAINNET_FACTORY_ADDR, Asset, PoolType } from '@dedust/sdk';
import { withRetry } from './tonClient';

const TONHUB_ENDPOINT = 'https://mainnet-v4.tonhubapi.com';

let client4Instance = null;
function getClient4() {
  if (!client4Instance) {
    client4Instance = new TonClient4({ endpoint: TONHUB_ENDPOINT });
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
 * Build swap TON → Jetton via DeDust
 */
export async function buildSwapTonToJetton({ jettonAddress, amountNano }) {
  return withRetry(async () => {
    const client = getClient4();
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const TON = Asset.native();
    const JETTON = Asset.jetton(Address.parse(jettonAddress));

    const pool = client.open(await factory.getPool(PoolType.VOLATILE, [TON, JETTON]));
    const poolStatus = await pool.getReadinessStatus();
    if (poolStatus !== 'ready') throw new Error('DeDust pool not ready');

    const tonVault = client.open(await factory.getNativeVault());
    const vaultStatus = await tonVault.getReadinessStatus();
    if (vaultStatus !== 'ready') throw new Error('DeDust vault not ready');

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
 * For jetton sells, user must send a jetton transfer to the vault
 * with forward_payload containing the swap info
 */
export async function buildSwapJettonToTon({ jettonAddress, amountRaw, userWalletAddress }) {
  return withRetry(async () => {
    const client = getClient4();
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const TON = Asset.native();
    const JETTON = Asset.jetton(Address.parse(jettonAddress));

    const pool = client.open(await factory.getPool(PoolType.VOLATILE, [TON, JETTON]));
    const poolStatus = await pool.getReadinessStatus();
    if (poolStatus !== 'ready') throw new Error('DeDust pool not ready');

    const jettonVault = client.open(await factory.getJettonVault(Address.parse(jettonAddress)));

    // For jetton sell: build VaultJetton swap payload
    // This is the forward_payload for the jetton transfer
    const swapPayload = beginCell()
      .storeUint(0xea06185d, 32)     // swap op
      .storeAddress(pool.address)    // pool_address
      .storeUint(0, 1)              // reserved
      .storeCoins(0n)               // limit
      .storeMaybeRef(null)          // next
      .storeRef(buildSwapParamsRef()) // swap_params
      .endCell();

    // Build jetton transfer message (op = 0xf8a7ea5)
    const jettonTransferBody = beginCell()
      .storeUint(0xf8a7ea5, 32)                    // transfer op
      .storeUint(0, 64)                             // query_id
      .storeCoins(BigInt(amountRaw))                // jetton amount
      .storeAddress(jettonVault.address)            // destination (vault)
      .storeAddress(Address.parse(userWalletAddress)) // response_destination
      .storeMaybeRef(null)                          // custom_payload
      .storeCoins(toNano('0.2'))                    // forward_ton_amount
      .storeMaybeRef(swapPayload)                   // forward_payload
      .endCell();

    // Need to send this to user's jetton wallet, not the vault directly
    // The caller (SwapModal) needs to resolve the user's jetton wallet address
    return {
      to: jettonVault.address.toString(), // placeholder - SwapModal needs user's jetton wallet
      value: toNano('0.3'),
      body: jettonTransferBody,
      isJettonTransfer: true,
      jettonVaultAddress: jettonVault.address.toString(),
    };
  });
}
