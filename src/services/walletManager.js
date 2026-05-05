import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { getWallets, setWallets } from '@/utils/storage';

export async function createWallet(name) {
  const mnemonic = await mnemonicNew();
  const keyPair = await mnemonicToWalletKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const address = wallet.address.toString({ bounceable: false });
  return {
    name,
    address,
    mnemonic,
    publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
    secretKey: Buffer.from(keyPair.secretKey).toString('hex'),
  };
}

export async function createBatchWallets(count) {
  const existing = getWallets();
  const startIndex = existing.length;
  const newWallets = [];
  for (let i = 0; i < count; i++) {
    const w = await createWallet(`Wallet ${startIndex + i}`);
    newWallets.push(w);
  }
  const all = [...existing, ...newWallets];
  setWallets(all);
  return all;
}

export async function importFromMnemonic(name, words) {
  const mnemonic = Array.isArray(words) ? words : words.trim().split(/\s+/);
  if (mnemonic.length !== 24) throw new Error('Mnemonic must be 24 words');
  const keyPair = await mnemonicToWalletKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const address = wallet.address.toString({ bounceable: false });
  const entry = {
    name,
    address,
    mnemonic,
    publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
    secretKey: Buffer.from(keyPair.secretKey).toString('hex'),
  };
  const existing = getWallets();
  const dup = existing.find(w => w.address === address);
  if (dup) throw new Error('Wallet already exists');
  existing.push(entry);
  setWallets(existing);
  return existing;
}

export function removeWallet(index) {
  const wallets = getWallets();
  if (index < 0 || index >= wallets.length) return wallets;
  wallets.splice(index, 1);
  setWallets(wallets);
  return wallets;
}

export function renameWallet(index, newName) {
  const wallets = getWallets();
  if (wallets[index]) {
    wallets[index].name = newName;
    setWallets(wallets);
  }
  return wallets;
}

export function exportWallets() {
  return JSON.stringify(getWallets(), null, 2);
}

export function importWalletsFromJSON(json) {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) throw new Error('Invalid format');
    setWallets(data);
    return data;
  } catch (e) {
    throw new Error('Invalid JSON: ' + e.message);
  }
}

export function getWalletKeyPair(walletData) {
  return {
    publicKey: Buffer.from(walletData.publicKey, 'hex'),
    secretKey: Buffer.from(walletData.secretKey, 'hex'),
  };
}

export function getWalletContract(walletData) {
  const pubKey = Buffer.from(walletData.publicKey, 'hex');
  return WalletContractV4.create({ workchain: 0, publicKey: pubKey });
}
