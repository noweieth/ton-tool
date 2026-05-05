import { internal } from '@ton/core';
import { getWalletContract, getWalletKeyPair } from './walletManager';
import { getTonClient, withRetry } from './tonClient';

export async function signAndSend(walletData, messages) {
  return withRetry(async () => {
    const client = getTonClient();
    const contract = getWalletContract(walletData);
    const keyPair = getWalletKeyPair(walletData);
    const openedContract = client.open(contract);

    let seqno = 0;
    try {
      seqno = await openedContract.getSeqno();
    } catch (e) {
      // exit_code -13 = contract not deployed, seqno = 0 (first TX will deploy)
      if (!e.message?.includes('-13')) throw e;
    }

    await openedContract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: messages.map(m => internal({
        to: m.to,
        value: m.value,
        body: m.body || undefined,
        bounce: m.bounce ?? false,
      })),
    });

    return { seqno, address: walletData.address };
  });
}

export async function sendTON(walletData, toAddress, amountNano) {
  return signAndSend(walletData, [{
    to: toAddress,
    value: BigInt(amountNano),
    bounce: false,
  }]);
}

export async function getSeqno(walletData) {
  return withRetry(async () => {
    const client = getTonClient();
    const contract = getWalletContract(walletData);
    const opened = client.open(contract);
    return opened.getSeqno();
  });
}

/**
 * Send Jetton tokens (TEP-74 transfer)
 * Sends a message to the sender's Jetton Wallet contract
 */
export async function sendJetton(walletData, { jettonWalletAddress, toAddress, amountRaw, forwardTonAmount }) {
  const { beginCell, Address, toNano } = await import('@ton/core');

  // TEP-74 transfer message body
  const body = beginCell()
    .storeUint(0xf8a7ea5, 32)        // op: transfer
    .storeUint(0, 64)                 // query_id
    .storeCoins(BigInt(amountRaw))    // amount of jettons
    .storeAddress(Address.parse(toAddress))  // destination
    .storeAddress(Address.parse(walletData.address)) // response_destination (refund excess)
    .storeBit(0)                      // no custom payload
    .storeCoins(toNano(forwardTonAmount || '0.001')) // forward_ton_amount
    .storeBit(0)                      // no forward payload
    .endCell();

  return signAndSend(walletData, [{
    to: jettonWalletAddress,
    value: toNano('0.05'),  // gas for jetton transfer
    body,
    bounce: true,
  }]);
}
