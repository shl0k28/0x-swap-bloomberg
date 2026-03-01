/**
 * Shared 0x proxy request options.
 */
export interface ZeroExProxyOptions {
  method: string;
  pathWithQuery: string;
  apiKey: string;
  upstreamBaseUrl?: string;
  body?: string;
}

/**
 * Normalized upstream 0x proxy response.
 */
export interface ZeroExProxyResponse {
  status: number;
  body: string;
  contentType: string;
}

/**
 * Proxies a request to the 0x API with required server-side headers.
 */
export async function proxyZeroExRequest(
  options: ZeroExProxyOptions,
): Promise<ZeroExProxyResponse> {
  const upstreamBaseUrl = options.upstreamBaseUrl ?? 'https://api.0x.org';
  const normalizedPath = options.pathWithQuery.startsWith('/')
    ? options.pathWithQuery
    : `/${options.pathWithQuery}`;
  const upstreamUrl = `${upstreamBaseUrl}${normalizedPath}`;

  const response = await fetch(upstreamUrl, {
    method: options.method,
    headers: {
      '0x-api-key': options.apiKey,
      '0x-version': 'v2',
      'Content-Type': 'application/json',
    },
    body: options.body,
  });

  return {
    status: response.status,
    body: await response.text(),
    contentType: response.headers.get('content-type') ?? 'application/json',
  };
}

/**
 * Parses error payload text into a user-facing JSON object.
 */
export function toProxyErrorBody(error: unknown, status = 500): string {
  const message = error instanceof Error ? error.message : 'Proxy request failed';
  return JSON.stringify({
    error: message,
    status,
  });
}
