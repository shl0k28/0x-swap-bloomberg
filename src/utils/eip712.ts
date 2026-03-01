import type { TypedDataParameter } from 'viem';
import type { Eip712TypedData } from '@/types/zeroex';

/**
 * Converts 0x EIP-712 types shape into viem-compatible map.
 */
export function toViemTypedDataTypes(
  types: Eip712TypedData['types'],
): Record<string, readonly TypedDataParameter[]> {
  const next: Record<string, readonly TypedDataParameter[]> = {};

  for (const [name, entries] of Object.entries(types)) {
    if (name !== 'EIP712Domain') {
      next[name] = entries;
    }
  }

  return next;
}
