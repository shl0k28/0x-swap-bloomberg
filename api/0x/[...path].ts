import { proxyZeroExRequest, toProxyErrorBody } from './proxy';

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[]>;
  body?: unknown;
  url?: string;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
}

/**
 * Catch-all server route for proxying browser calls to the 0x API.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const apiKey = process.env['ZEROX_API_KEY'] ?? '';
  if (apiKey.length === 0) {
    res.status(500).setHeader('Content-Type', 'application/json');
    res.send(toProxyErrorBody(new Error('Missing ZEROX_API_KEY'), 500));
    return;
  }

  const segmentsValue = req.query?.['path'];
  const segments = Array.isArray(segmentsValue)
    ? segmentsValue
    : typeof segmentsValue === 'string'
      ? [segmentsValue]
      : [];
  const pathname = `/${segments.join('/')}`;
  const search = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const pathWithQuery = `${pathname}${search}`;
  const method = req.method?.toUpperCase() ?? 'GET';
  const rawBody =
    method === 'POST' && req.body !== undefined ? JSON.stringify(req.body) : undefined;

  try {
    const upstream = await proxyZeroExRequest({
      method,
      pathWithQuery,
      apiKey,
      upstreamBaseUrl: process.env['ZEROX_API_BASE_URL'] ?? 'https://api.0x.org',
      body: rawBody,
    });
    res.status(upstream.status).setHeader('Content-Type', upstream.contentType);
    res.send(upstream.body);
  } catch (error) {
    res.status(500).setHeader('Content-Type', 'application/json');
    res.send(toProxyErrorBody(error, 500));
  }
}
