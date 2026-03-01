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
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error occurred';
}
