export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: Record<string, QueryValue | QueryValue[]>;
  body?: unknown;
  timeout?: number;
}

export interface HttpClientOptions {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
  fetch?: typeof globalThis.fetch;
  timeout?: number;
}

export class HttpError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T;

  constructor(message: string, status: number, data: T) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

function appendQuery(url: string, query?: RequestOptions["query"]) {
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value !== undefined && value !== null) search.append(key, String(value));
    }
  }

  const separator = url.includes("?") ? "&" : "?";
  const value = search.toString();
  return value ? `${url}${separator}${value}` : url;
}

function mergeSignals(signal: AbortSignal | null | undefined, timeout: number) {
  const timeoutSignal = AbortSignal.timeout(timeout);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

async function parseResponse(response: Response) {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

export function createHttpClient({
  baseUrl = "",
  defaultHeaders,
  fetch: fetcher = globalThis.fetch,
  timeout: defaultTimeout = 15_000,
}: HttpClientOptions = {}) {
  async function request<T>(method: string, path: string, options: RequestOptions = {}) {
    const { body, headers, query, signal, timeout = defaultTimeout, ...init } = options;
    const requestHeaders = new Headers(defaultHeaders);
    new Headers(headers).forEach((value, key) => requestHeaders.set(key, value));

    const hasJsonBody = body !== undefined && !(body instanceof FormData);
    if (hasJsonBody && !requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json");
    }

    const response = await fetcher(appendQuery(`${baseUrl}${path}`, query), {
      ...init,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : hasJsonBody ? JSON.stringify(body) : body,
      signal: mergeSignals(signal, timeout),
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      const message =
        typeof data === "object" && data && "message" in data
          ? String(data.message)
          : `请求失败 (${response.status})`;
      throw new HttpError(message, response.status, data);
    }

    return data as T;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("POST", path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PUT", path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PATCH", path, { ...options, body }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
  };
}
