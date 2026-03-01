/**
 * 0x HTTP transport configuration.
 */
export interface ZeroExHttpClientConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Minimal fetch client for 0x endpoints with shared headers and error normalization.
 */
export class ZeroExHttpClient {
  private readonly apiKey?: string;

  private readonly baseUrl: string;

  public constructor(config: ZeroExHttpClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? '/api/0x';
  }

  /**
   * Executes a GET request against the 0x API.
   */
  public async get<T>(path: string, query: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, query);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    return this.parseJson<T>(response);
  }

  /**
   * Executes a POST request against the 0x API.
   */
  public async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    return this.parseJson<T>(response);
  }

  /**
   * Builds endpoint headers expected by 0x Swap API v2.
   */
  private buildHeaders(): Headers {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (this.apiKey && !this.baseUrl.startsWith('/')) {
      headers.set('0x-api-key', this.apiKey);
      headers.set('0x-version', 'v2');
    }
    return headers;
  }

  /**
   * Serializes query params into a URL string.
   */
  private buildUrl(path: string, query: Record<string, string | number | undefined>): string {
    const url = this.baseUrl.startsWith('/')
      ? new URL(
          `${this.baseUrl}${path}`,
          typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
        )
      : new URL(`${this.baseUrl}${path}`);

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    if (this.baseUrl.startsWith('/')) {
      return `${url.pathname}${url.search}`;
    }

    return url.toString();
  }

  /**
   * Parses JSON body and raises rich errors for failed responses.
   */
  private async parseJson<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      const message = this.getErrorMessage(payload);
      throw new Error(`0x API ${response.status}: ${message}`);
    }

    return payload as T;
  }

  /**
   * Extracts a human-readable error from unknown payloads.
   */
  private getErrorMessage(payload: unknown): string {
    if (typeof payload === 'object' && payload !== null) {
      const messageValue = (payload as Record<string, unknown>)['message'];
      if (typeof messageValue === 'string') {
        return messageValue;
      }

      const detailValue = (payload as Record<string, unknown>)['detail'];
      if (typeof detailValue === 'string') {
        return detailValue;
      }
    }

    return 'Unknown 0x API error';
  }
}
