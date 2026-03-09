import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { proxyZeroExRequest, toProxyErrorBody } from './api/0x/proxy';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite configuration for the Matcha AI frontend.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const zeroExApiKey = env['ZEROX_API_KEY'] ?? '';
  const zeroExApiBaseUrl = env['ZEROX_API_BASE_URL'] ?? 'https://api.0x.org';

  const zeroExProxyPlugin: Plugin = {
    name: 'valence-0x-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/0x', (req, res) => {
        void (async () => {
          if (zeroExApiKey.length === 0) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(toProxyErrorBody(new Error('Missing ZEROX_API_KEY'), 500));
            return;
          }

          const method = req.method?.toUpperCase() ?? 'GET';
          const rawPath =
            ('originalUrl' in req && typeof req.originalUrl === 'string'
              ? req.originalUrl
              : req.url) ?? '/';
          const pathWithQuery = rawPath.startsWith('/api/0x')
            ? rawPath.slice('/api/0x'.length) || '/'
            : rawPath;
          const body = method === 'POST' ? await readRequestBody(req) : undefined;

          try {
            const upstream = await proxyZeroExRequest({
              method,
              pathWithQuery,
              apiKey: zeroExApiKey,
              upstreamBaseUrl: zeroExApiBaseUrl,
              body,
            });
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', upstream.contentType);
            res.end(upstream.body);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(toProxyErrorBody(error, 500));
          }
        })();
      });
    },
  };

  return {
    plugins: [react(), zeroExProxyPlugin],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
  };
});

/**
 * Reads incoming request body into a string for proxy forwarding.
 */
async function readRequestBody(request: IncomingMessage): Promise<string> {
  let raw = '';
  const decoder = new TextDecoder();
  for await (const chunk of request) {
    if (typeof chunk === 'string') {
      raw += chunk;
      continue;
    }
    if (chunk instanceof Uint8Array) {
      raw += decoder.decode(chunk, { stream: true });
    }
  }
  raw += decoder.decode();
  return raw;
}
