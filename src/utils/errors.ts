import type { ZeroExIssues } from '@/types/zeroex';

/**
 * Maps protocol issue payloads to user-facing messages.
 */
export function getUserFacingIssueMessages(issues: ZeroExIssues): string[] {
  const messages: string[] = [];

  if (issues.balance) {
    messages.push(
      `Insufficient balance: need ${issues.balance.expected}, have ${issues.balance.actual}.`,
    );
  }

  if (issues.allowance) {
    messages.push('Token allowance is insufficient. Approval is required before swap execution.');
  }

  if (issues.simulationIncomplete) {
    messages.push('Simulation is incomplete. Quote may fail at execution time.');
  }

  if (issues.invalidSourcesPassed.length > 0) {
    messages.push(`Invalid liquidity sources: ${issues.invalidSourcesPassed.join(', ')}.`);
  }

  return messages;
}

/**
 * Normalizes unknown thrown values into readable error text.
 */
export function getErrorMessage(error: unknown): string {
  const code = extractErrorCode(error);
  const raw = extractRawMessage(error);

  if (code === 4001 || isUserRejected(raw)) {
    return 'Transaction rejected in wallet.';
  }

  if (/insufficient funds/i.test(raw)) {
    return 'Insufficient balance to cover amount plus gas.';
  }

  const revertedReason = extractRevertReason(raw);
  if (revertedReason) {
    return `Execution reverted: ${revertedReason}`;
  }

  const normalized = normalizeMessage(raw);
  if (normalized.length > 0) {
    return normalized;
  }

  return 'Request failed. Please try again.';
}

function extractRawMessage(error: unknown): string {
  if (error instanceof Error) {
    return pickFirstString(error as unknown as Record<string, unknown>, [
      'shortMessage',
      'message',
      'details',
      'cause',
    ]);
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    return pickFirstString(error as Record<string, unknown>, [
      'shortMessage',
      'message',
      'details',
      'cause',
    ]);
  }

  return '';
}

function extractErrorCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = (error as Record<string, unknown>)['code'];
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === 'string') {
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function pickFirstString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return '';
}

function isUserRejected(message: string): boolean {
  return /(user rejected|user denied|request rejected|rejected the request)/i.test(message);
}

function extractRevertReason(message: string): string | null {
  const match = message.match(/execution reverted(?::)?\s*([^.;]+)/i);
  if (!match) {
    return null;
  }

  const reason = match[1]?.trim();
  return reason && reason.length > 0 ? reason : null;
}

function normalizeMessage(message: string): string {
  const withoutArgs = message.replace(/Request Arguments:[\s\S]*/i, '');
  const withoutVersions = withoutArgs.replace(/Version:\s*viem[^\s]*/gi, '');
  const withoutHexBlob = withoutVersions.replace(/0x[a-fA-F0-9]{96,}/g, '[hex data]');
  const compact = withoutHexBlob.replace(/\s+/g, ' ').trim();
  const withoutPrefix = compact.replace(/^Internal JSON-RPC error\.?\s*/i, '');
  if (withoutPrefix.length <= 180) {
    return withoutPrefix;
  }

  return `${withoutPrefix.slice(0, 177)}...`;
}
