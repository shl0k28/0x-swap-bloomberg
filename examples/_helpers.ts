import pc from 'picocolors';
import { createPublicClient, createWalletClient, http, isAddress, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getViemChain, isSupportedChainId } from '@/constants/chains';
import { loadNodeRuntimeConfig } from '@/config/nodeRuntime';
import { createMatchaAiServices } from '@/createServices';

/**
 * Shared constants + helpers for examples.
 */
export const deadAddress: Address = '0x1111111111111111111111111111111111111111';

/**
 * Returns initialized core services from .env.
 */
export function getServices() {
  const config = loadNodeRuntimeConfig();
  return {
    config,
    services: createMatchaAiServices(config),
  };
}

/**
 * Resolves quote taker address from env config.
 */
export function getTakerAddress(): Address {
  const envAddress = process.env['DEMO_WALLET_ADDRESS'];
  if (envAddress && isAddress(envAddress)) {
    return envAddress;
  }

  return deadAddress;
}

/**
 * Returns wallet/public clients for transaction execution examples.
 */
export function getExecutionClients(chainId: number) {
  if (!isSupportedChainId(chainId)) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }

  const key = process.env['PRIVATE_KEY'];
  if (!key || !key.startsWith('0x')) {
    throw new Error('Missing PRIVATE_KEY in environment for execution example');
  }

  const chain = getViemChain(chainId);
  const rpcUrl = getRpcUrl(chainId);
  const account = privateKeyToAccount(key as `0x${string}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  return {
    account,
    publicClient,
    walletClient,
  };
}

/**
 * Selects RPC URL from env per chain.
 */
export function getRpcUrl(chainId: number): string {
  const byChain: Record<number, string | undefined> = {
    1: process.env['RPC_URL_MAINNET'],
    8453: process.env['RPC_URL_BASE'],
    42161: process.env['RPC_URL_ARBITRUM'],
    10: process.env['RPC_URL_OPTIMISM'],
    137: process.env['RPC_URL_POLYGON'],
  };

  const url = byChain[chainId];
  if (!url) {
    throw new Error(`Missing RPC URL for chain ${chainId}`);
  }

  return url;
}

/**
 * Pretty section header for terminal output.
 */
export function printHeader(title: string, subtitle: string): void {
  console.log(pc.bold(pc.cyan(`\n${title}`)));
  console.log(pc.dim(subtitle));
  console.log(pc.dim('─'.repeat(72)));
}
