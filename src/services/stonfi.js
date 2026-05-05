import { StonApiClient } from '@ston-fi/api';
import { routerFactory, dexFactory } from '@ston-fi/sdk';
import { getTonClient, withRetry } from './tonClient';

const apiClient = new StonApiClient();
const TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'; // native TON

/**
 * Build swap TON → Jetton via STON.fi
 * Step 1: Simulate swap via API (get router + quote)
 * Step 2: Build TX params via SDK with correct router/pTON
 */
export async function buildSwapTonToJetton({ jettonAddress, offerAmount, slippage, userWalletAddress }) {
  return withRetry(async () => {
    // Step 1: Simulate to get router info + quote
    const simulation = await apiClient.simulateSwap({
      offerAddress: TON_ADDRESS,
      askAddress: jettonAddress,
      offerUnits: offerAmount,
      slippageTolerance: slippage || '0.01',
    });

    // Step 2: Create router + pTON from simulation result
    const client = getTonClient();
    const router = client.open(
      routerFactory({
        address: simulation.router.address,
        majorVersion: simulation.router.majorVersion,
        minorVersion: simulation.router.minorVersion,
        routerType: simulation.router.routerType,
      })
    );

    const { pTON: PtonClass } = dexFactory({
      majorVersion: simulation.router.majorVersion,
      minorVersion: simulation.router.minorVersion,
      routerType: simulation.router.routerType,
    });
    const proxyTon = new PtonClass(simulation.router.ptonMasterAddress);

    // Step 3: Build TX params
    const txParams = await router.getSwapTonToJettonTxParams({
      proxyTon,
      userWalletAddress,
      offerAmount: BigInt(offerAmount),
      askJettonAddress: jettonAddress,
      minAskAmount: BigInt(simulation.minAskUnits),
    });

    return {
      to: txParams.to.toString(),
      value: txParams.value,
      body: txParams.body,
      quote: {
        askUnits: simulation.askUnits,
        minAskUnits: simulation.minAskUnits,
        priceImpact: simulation.priceImpact,
        swapRate: simulation.swapRate,
      },
    };
  });
}

/**
 * Build swap Jetton → TON via STON.fi
 */
export async function buildSwapJettonToTon({ jettonAddress, offerAmount, slippage, userWalletAddress }) {
  return withRetry(async () => {
    // Step 1: Simulate
    const simulation = await apiClient.simulateSwap({
      offerAddress: jettonAddress,
      askAddress: TON_ADDRESS,
      offerUnits: offerAmount,
      slippageTolerance: slippage || '0.01',
    });

    // Step 2: Create router + pTON
    const client = getTonClient();
    const router = client.open(
      routerFactory({
        address: simulation.router.address,
        majorVersion: simulation.router.majorVersion,
        minorVersion: simulation.router.minorVersion,
        routerType: simulation.router.routerType,
      })
    );

    const { pTON: PtonClass } = dexFactory({
      majorVersion: simulation.router.majorVersion,
      minorVersion: simulation.router.minorVersion,
      routerType: simulation.router.routerType,
    });
    const proxyTon = new PtonClass(simulation.router.ptonMasterAddress);

    // Step 3: Build TX params
    const txParams = await router.getSwapJettonToTonTxParams({
      proxyTon,
      userWalletAddress,
      offerJettonAddress: jettonAddress,
      offerAmount: BigInt(offerAmount),
      minAskAmount: BigInt(simulation.minAskUnits),
    });

    return {
      to: txParams.to.toString(),
      value: txParams.value,
      body: txParams.body,
      quote: {
        askUnits: simulation.askUnits,
        minAskUnits: simulation.minAskUnits,
        priceImpact: simulation.priceImpact,
        swapRate: simulation.swapRate,
      },
    };
  });
}
