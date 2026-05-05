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
