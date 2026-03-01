import type { Address, PublicClient, WalletClient } from 'viem';
import { maxUint256, parseAbi } from 'viem';

/**
 * Minimal ERC-20 ABI required for allowance checks and approvals.
 */
const erc20AllowanceAbi = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

/**
 * Reads current ERC-20 allowance for a spender.
 */
export async function readTokenAllowance(
  publicClient: PublicClient,
  token: Address,
  owner: Address,
  spender: Address,
): Promise<bigint> {
  return publicClient.readContract({
    address: token,
    abi: erc20AllowanceAbi,
    functionName: 'allowance',
    args: [owner, spender],
  });
}

/**
 * Sends an unlimited token approval transaction.
 */
export async function approveTokenUnlimited(
  walletClient: WalletClient,
  token: Address,
  spender: Address,
): Promise<`0x${string}`> {
  const account = walletClient.account;

  if (!account) {
    throw new Error('Wallet client account is undefined; connect wallet before approval');
  }

  return walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: token,
    abi: erc20AllowanceAbi,
    functionName: 'approve',
    args: [spender, maxUint256],
  });
}
